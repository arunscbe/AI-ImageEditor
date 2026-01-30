import os
import logging
import re
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from providers.provider_manager import provider_manager
from config.configuration import orchestrator_config, provider_config
from config.prompts import orchestrator_prompts
from .tools_schema import ALL_TOOLS
from .conversation_manager import ConversationManager, conversation_manager as default_conv_manager

logger = logging.getLogger(__name__)


class OpenAIOrchestrator:
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        conversation_manager: Optional[ConversationManager] = None
    ):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = model or orchestrator_config.OPENAI_ORCHESTRATOR_MODEL
        self.conversation_manager = conversation_manager or default_conv_manager
        self.system_prompt = self._build_system_prompt()
        logger.info(f"OpenAI Orchestrator initialized with model: {self.model}")
    
    def _build_system_prompt(self) -> str:
        from config.prompts.orchestrator_prompts import ProviderDefaults
        
        available_providers = provider_manager.list_providers()
        providers_info = orchestrator_prompts.format_providers_info(available_providers)
        
        defaults = ProviderDefaults(
            generate=provider_config.DEFAULT_PROVIDER_GENERATE,
            vectorize=provider_config.DEFAULT_PROVIDER_VECTORIZE,
            erase=provider_config.DEFAULT_PROVIDER_ERASE
        )
        
        return orchestrator_prompts.build_orchestrator_system_prompt(
            providers_info=providers_info,
            defaults=defaults,
            include_tool_contracts=False
        )
    
    def _convert_tools_to_openai_format(self) -> List[Dict[str, Any]]:
        """Convert Anthropic tool format to OpenAI function format"""
        openai_tools = []
        for tool in ALL_TOOLS:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["input_schema"]
                }
            })
        return openai_tools
    
    def _filter_vectorize_recommendations(self, result: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """
        Filter out vectorization recommendations from analysis unless user explicitly requested it.
        
        Args:
            result: Analysis result dictionary
            user_message: Original user message
        
        Returns:
            Filtered result dictionary
        """
        # Check if user explicitly requested vectorization
        vectorize_keywords = ["vectorize", "vector", "svg", "convert to svg", "make it vector"]
        user_wants_vectorize = any(keyword in user_message.lower() for keyword in vectorize_keywords)
        
        if user_wants_vectorize:
            # User wants vectorization, keep recommendations as-is
            return result
        
        # User didn't explicitly request vectorization, filter it out
        if isinstance(result, dict):
            # Filter recommendations list
            if "recommendations" in result:
                recommendations = result.get("recommendations", [])
                if isinstance(recommendations, list):
                    filtered = [r for r in recommendations if "vectorize" not in str(r).lower()]
                    result["recommendations"] = filtered
            
            # Filter recommended_workflow
            if "recommended_workflow" in result:
                workflow = result.get("recommended_workflow", "")
                if "vectorize" in str(workflow).lower():
                    # Replace "enhance_then_vectorize" with "enhance_only"
                    if "enhance_then_vectorize" in workflow:
                        result["recommended_workflow"] = "enhance_only"
                    elif "vectorize_only" in workflow:
                        result["recommended_workflow"] = "use_as_is"
                    else:
                        # Remove vectorize from workflow string
                        result["recommended_workflow"] = workflow.replace("vectorize", "").strip()
            
            # Filter data.recommendations if nested
            if "data" in result and isinstance(result["data"], dict):
                if "recommendations" in result["data"]:
                    recommendations = result["data"].get("recommendations", [])
                    if isinstance(recommendations, list):
                        filtered = [r for r in recommendations if "vectorize" not in str(r).lower()]
                        result["data"]["recommendations"] = filtered
                
                if "recommended_workflow" in result["data"]:
                    workflow = result["data"].get("recommended_workflow", "")
                    if "vectorize" in str(workflow).lower():
                        if "enhance_then_vectorize" in workflow:
                            result["data"]["recommended_workflow"] = "enhance_only"
                        elif "vectorize_only" in workflow:
                            result["data"]["recommended_workflow"] = "use_as_is"
        
        logger.info(f"Filtered vectorization recommendations from analysis (user didn't explicitly request it)")
        return result
    
    async def process_message(
        self,
        message: str,
        conversation_id: str = "default",
        max_iterations: Optional[int] = None
    ) -> Dict[str, Any]:
        max_iterations = max_iterations or orchestrator_config.DEFAULT_ITERATIONS
        
        # Auto-detect image URLs that need analysis
        image_url_pattern = r'https?://[^\s]+\.(png|jpg|jpeg|gif|webp|svg)'
        image_urls = re.findall(image_url_pattern, message, re.IGNORECASE)
        
        should_analyze = orchestrator_config.should_auto_analyze(message, bool(image_urls))
        
        if should_analyze:
            logger.info(f"Auto-triggering image analysis for URL: {image_urls[0]}")
            message = orchestrator_prompts.build_mandatory_analysis_prefix(image_urls[0], message)
        elif image_urls and orchestrator_config.is_simple_edit(message):
            logger.info(f"Skipping analysis for simple edit: '{message[:50]}...' (saves ~7s)")
        
        style = "embroidery"
        provider_override = None
        leather_color = None
        ink_color = None
        font_style = None
        
        if "[Style:" in message:
            style_match = re.search(r'\[Style:\s*(\w+)\]', message)
            if style_match:
                style = style_match.group(1).lower()
                message = re.sub(r'\[Style:\s*\w+\]', '', message).strip()
        
        if "[Provider:" in message:
            provider_match = re.search(r'\[Provider:\s*([\w-]+)\]', message)
            if provider_match:
                provider_override = provider_match.group(1).lower()
                message = re.sub(r'\[Provider:\s*[\w-]+\]', '', message).strip()
        
        if "[LeatherColor:" in message:
            leather_match = re.search(r'\[LeatherColor:\s*([^\]]+)\]', message)
            if leather_match:
                leather_color = leather_match.group(1).strip()
                message = re.sub(r'\[LeatherColor:\s*[^\]]+\]', '', message).strip()
        
        if "[InkColor:" in message:
            ink_match = re.search(r'\[InkColor:\s*([^\]]+)\]', message)
            if ink_match:
                ink_color = ink_match.group(1).strip()
                message = re.sub(r'\[InkColor:\s*[^\]]+\]', '', message).strip()
        
        if "[Font:" in message:
            font_match = re.search(r'\[Font:\s*([^\]]+)\]', message)
            if font_match:
                font_style = font_match.group(1).strip()
                message = re.sub(r'\[Font:\s*[^\]]+\]', '', message).strip()
        
        conversation = self.conversation_manager.get_or_create_conversation(conversation_id)
        conversation.add_message("user", message)
        
        # Store original message for filtering analysis recommendations
        original_user_message = message
        
        messages = [
            {"role": "system", "content": self.system_prompt}
        ] + conversation.get_messages_for_llm()
        
        response_text = ""
        tool_results = []
        actions_taken = []
        generated_images = []
        
        tools = self._convert_tools_to_openai_format()
        
        iteration = 0
        while iteration < max_iterations:
            iteration += 1
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=tools,
                tool_choice="auto"
            )
            
            message = response.choices[0].message
            
            if message.content:
                response_text += message.content
            
            if not message.tool_calls:
                break
            
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in message.tool_calls
                ]
            })
            
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                import json
                tool_input = json.loads(tool_call.function.arguments)
                
                if tool_name == "vectorize_image":
                    tool_input["provider"] = "recraft"
                
                elif provider_override and "provider" not in tool_input:
                    tool_input["provider"] = provider_override
                
                if tool_name in ["edit_image", "image_to_image", "generate_image"]:
                    tool_input["style"] = style
                    if style == "leather":
                        if leather_color:
                            tool_input["leather_color"] = leather_color
                        if ink_color:
                            tool_input["ink_color"] = ink_color
                    if font_style:
                        tool_input["font_style"] = font_style
                
                try:
                    result = await self._execute_tool(tool_name, tool_input)
                    
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result,
                        "success": True
                    })
                    
                    actions_taken.append(f"{tool_name}")
                    
                    # Track if this is a final output tool (vectorize) or intermediate
                    is_final_output = tool_name in ["vectorize_image", "generate_image"]
                    
                    # For chained workflows (enhance → vectorize), only keep final output
                    # Clear intermediate images when a final output tool succeeds
                    if is_final_output and generated_images:
                        # Mark previous images as intermediate (they were steps toward final)
                        generated_images.clear()
                    
                    if result.get("data", {}).get("images"):
                        for img in result["data"]["images"]:
                            url = img.get("url") if isinstance(img, dict) else img
                            if url:
                                generated_images.append(url)
                    elif result.get("images"):
                        for img in result["images"]:
                            url = img.get("url") if isinstance(img, dict) else img
                            if url:
                                generated_images.append(url)
                    
                    # Filter out vectorization recommendations unless user explicitly requested it
                    if tool_name == "analyze_image":
                        result = self._filter_vectorize_recommendations(result, original_user_message)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result)
                    })
                
                except Exception as e:
                    error_msg = f"Error executing {tool_name}: {str(e)}"
                    
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "error": str(e),
                        "success": False
                    })
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": error_msg
                    })
            
            if response.choices[0].finish_reason == "stop":
                break
        
        conversation.add_message(
            "assistant",
            response_text,
            images=generated_images,
            metadata={
                "actions_taken": actions_taken,
                "tool_results": tool_results
            }
        )
        
        return {
            "message": response_text,
            "images": generated_images,
            "actions_taken": actions_taken,
            "tool_results": tool_results,
            "conversation_id": conversation_id
        }
    
    async def _execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Same tool execution as Claude orchestrator"""
        logger.info(f"Executing tool: {tool_name}, input_keys: {list(tool_input.keys())}")
        
        if tool_name == "analyze_image":
            logger.info(f"analyze_image called with image_url: {tool_input.get('image_url', 'N/A')[:100]}")
            result = await provider_manager.analyze_image(**tool_input)
            logger.info(f"analyze_image completed, provider: {result.get('provider', 'unknown')}")
            return result
        
        elif tool_name == "generate_image":
            logger.info(f"generate_image called with provider: {tool_input.get('provider', 'default')}")
            return await provider_manager.generate_image(**tool_input)
        
        elif tool_name == "edit_image":
            return await provider_manager.edit_image(**tool_input)
        
        elif tool_name == "image_to_image":
            return await provider_manager.image_to_image(**tool_input)
        
        elif tool_name == "remove_background":
            return await provider_manager.remove_background(**tool_input)
        
        elif tool_name == "replace_background":
            return await provider_manager.replace_background(**tool_input)
        
        elif tool_name == "vectorize_image":
            return await provider_manager.vectorize_image(**tool_input)
        
        elif tool_name == "erase_region":
            from services.image_operations import image_operations
            return await image_operations.erase_region(**tool_input)
        
        elif tool_name == "ingest_file":
            from services.ingestion_service import ingestion_service
            # Download the file first
            import httpx
            file_url = tool_input.get("file_url")
            vectorize = tool_input.get("vectorize", True)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url)
                response.raise_for_status()
                file_data = response.content
                
            # Extract filename from URL
            from urllib.parse import urlparse
            filename = urlparse(file_url).path.split("/")[-1]
            
            return await ingestion_service.process_upload(
                file_data=file_data,
                filename=filename,
                vectorize=vectorize
            )
        
        elif tool_name == "list_providers":
            providers = provider_manager.list_providers()
            return {"providers": providers}
        
        else:
            raise ValueError(f"Unknown tool: {tool_name}")
    
    def get_conversation_history(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        conversation = self.conversation_manager.get_conversation(conversation_id)
        if conversation:
            return conversation.to_dict()
        return None
    
    def clear_conversation(self, conversation_id: str) -> bool:
        return self.conversation_manager.delete_conversation(conversation_id)


_openai_orchestrator_instance = None

def get_openai_orchestrator() -> OpenAIOrchestrator:
    global _openai_orchestrator_instance
    if _openai_orchestrator_instance is None:
        _openai_orchestrator_instance = OpenAIOrchestrator()
    return _openai_orchestrator_instance

openai_orchestrator = None

