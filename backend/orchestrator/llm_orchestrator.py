import os
import logging
import re
from typing import Dict, List, Any, Optional
from anthropic import Anthropic
from providers.provider_manager import provider_manager
from config.configuration import orchestrator_config, provider_config
from config.prompts import orchestrator_prompts
from .tools_schema import ALL_TOOLS
from .conversation_manager import ConversationManager, conversation_manager as default_conv_manager

logger = logging.getLogger(__name__)


class LLMOrchestrator:
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        conversation_manager: Optional[ConversationManager] = None
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = model or orchestrator_config.CLAUDE_MODEL
        self.conversation_manager = conversation_manager or default_conv_manager
        self.system_prompt = self._build_system_prompt()
    
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
        
        conversation = self.conversation_manager.get_or_create_conversation(conversation_id)
        conversation.add_message("user", message)
        
        messages = conversation.get_messages_for_llm()
        
        response_text = ""
        tool_results = []
        actions_taken = []
        generated_images = []
        
        iteration = 0
        while iteration < max_iterations:
            iteration += 1
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=self.system_prompt,
                tools=ALL_TOOLS,
                messages=messages
            )
            
            for block in response.content:
                if block.type == "text":
                    response_text += block.text
                
                elif block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input
                    
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
                        
                        messages.append({
                            "role": "assistant",
                            "content": response.content
                        })
                        messages.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": str(result)
                            }]
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
                            "role": "assistant",
                            "content": response.content
                        })
                        messages.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": error_msg,
                                "is_error": True
                            }]
                        })
            
            if response.stop_reason == "end_turn":
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


_orchestrator_instance = None

def get_orchestrator() -> LLMOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = LLMOrchestrator()
    return _orchestrator_instance

orchestrator = None

