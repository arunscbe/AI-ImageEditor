import os
from typing import Dict, List, Any, Optional
from anthropic import Anthropic
from providers.provider_manager import provider_manager
from .tools_schema import ALL_TOOLS
from .conversation_manager import ConversationManager, conversation_manager as default_conv_manager


class LLMOrchestrator:
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-3-5-sonnet-20241022",
        conversation_manager: Optional[ConversationManager] = None
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")
        
        self.client = Anthropic(api_key=self.api_key)
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
- **recraft**: Fast, versatile, good for general use, supports background operations
- **openai**: Best prompt understanding, creative, good for artistic images
- **replicate**: Highest quality (Flux models), best for photorealistic images
- **google-imagen**: Best for text rendering in images (logos, signs, posters)

When enhancing prompts:
- Add style details (photorealistic, digital art, oil painting, etc.)
- Include lighting (natural light, studio lighting, golden hour, etc.)
- Specify quality (4K, professional, detailed, etc.)
- Add composition details (centered, rule of thirds, etc.)

Remember: TAKE ACTION FIRST (call tools), EXPLAIN LATER (brief confirmation)."""
    
    async def process_message(
        self,
        message: str,
        conversation_id: str = "default",
        max_iterations: int = 5
    ) -> Dict[str, Any]:
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
                        print(f"{error_msg}")
                        
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


_orchestrator_instance = None

def get_orchestrator() -> LLMOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = LLMOrchestrator()
    return _orchestrator_instance

orchestrator = None

