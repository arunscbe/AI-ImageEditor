import os
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from providers.provider_manager import provider_manager
from .tools_schema import ALL_TOOLS
from .conversation_manager import ConversationManager, conversation_manager as default_conv_manager


class OpenAIOrchestrator:
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        conversation_manager: Optional[ConversationManager] = None
    ):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = model
        self.conversation_manager = conversation_manager or default_conv_manager
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        available_providers = provider_manager.list_providers()
        providers_info = "\n".join([
            f"- {p['name']}: {', '.join(p['features'])}"
            for p in available_providers
        ])
        
        return f"""You are an AI image generation assistant with access to multiple AI providers.

IMPORTANT: When the user asks to create/generate an image, you MUST immediately call the generate_image tool. 
Do NOT just describe what you will do - actually DO it by calling the tool.

Your workflow:
1. Understand what the user wants
2. IMMEDIATELY call the appropriate tool (don't explain first)
3. After the tool succeeds, provide a brief confirmation

Available providers and their capabilities:
{providers_info}

Provider selection guidelines:
- **gemini**: 🌟 BEST CHOICE - Google AI Studio quality (generate AND edit with gemini-3-pro-image-preview)
- **recraft**: ✅ Fast, versatile, supports all operations (good backup)
- **openai**: ⚠️ Use for generation only (NOT for editing - has format restrictions)
- **google-imagen**: ⚠️ DEPRECATED - use 'gemini' instead
- **replicate**: ⚠️ Use with caution, may have rate limits

IMPORTANT RULES:
- For ANY image operation (generate/edit/enhance) → prefer 'gemini' first!
- Gemini uses 'gemini-3-pro-image-preview' model for image editing
- Only fall back to other providers if Gemini fails

When enhancing prompts:
- Add style details (photorealistic, digital art, oil painting, etc.)
- Include lighting (natural light, studio lighting, golden hour, etc.)
- Specify quality (4K, professional, detailed, etc.)
- Add composition details (centered, rule of thirds, etc.)

Remember: TAKE ACTION FIRST (call tools), EXPLAIN LATER (brief confirmation)."""
    
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
    
    async def process_message(
        self,
        message: str,
        conversation_id: str = "default",
        max_iterations: int = 5
    ) -> Dict[str, Any]:
        import re
        
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
                
                if provider_override and "provider" not in tool_input:
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
                
                print(f"🔧 Executing tool: {tool_name}")
                print(f"   Input: {tool_input}")
                
                try:
                    result = await self._execute_tool(tool_name, tool_input)
                    
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result,
                        "success": True
                    })
                    
                    actions_taken.append(f"{tool_name}")
                    
                    # Extract image URLs from various response formats
                    if result.get("data", {}).get("images"):
                        for img in result["data"]["images"]:
                            url = img.get("url") if isinstance(img, dict) else img
                            if url:
                                print(f"📸 Found image URL: {url}")
                                generated_images.append(url)
                    # Handle direct images array
                    elif result.get("images"):
                        for img in result["images"]:
                            url = img.get("url") if isinstance(img, dict) else img
                            if url:
                                print(f"📸 Found image URL: {url}")
                                generated_images.append(url)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result)
                    })
                
                except Exception as e:
                    error_msg = f"Error executing {tool_name}: {str(e)}"
                    print(f"{error_msg}")
                    
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
        if tool_name == "generate_image":
            return await provider_manager.generate_image(**tool_input)
        
        elif tool_name == "upscale_image":
            return await provider_manager.upscale_image(**tool_input)
        
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


_openai_orchestrator_instance = None

def get_openai_orchestrator() -> OpenAIOrchestrator:
    global _openai_orchestrator_instance
    if _openai_orchestrator_instance is None:
        _openai_orchestrator_instance = OpenAIOrchestrator()
    return _openai_orchestrator_instance

openai_orchestrator = None

