# LLM Orchestrator - Smart AI Image Generation 🧠

## Overview

The LLM Orchestrator is the "smart brain" that sits on top of all image providers, using Claude 3.5 Sonnet to:

- 🎯 **Understand user intent** - Natural language to actions
- 🤖 **Select best provider** - Chooses optimal AI for each task
- ✨ **Enhance prompts** - Improves vague descriptions
- 🔗 **Chain operations** - Multi-step workflows automatically
- 💭 **Remember context** - Maintains conversation history
- 🛡️ **Handle errors** - Graceful fallbacks and retries

## Architecture

```
User: "Create a professional logo with text 'TechCorp'"
    ↓
🧠 LLM Orchestrator (Claude)
    │
    ├─ Analyzes: User wants text in image
    ├─ Chooses: google-imagen (best for text)
    ├─ Enhances: "Modern minimalist logo design..."
    └─ Executes: generate_image tool
    ↓
Provider: google-imagen
    ↓
Result: Perfect logo with text
```

## Quick Start

### 1. Setup Environment

```bash
# Add Claude API key to .env
ANTHROPIC_API_KEY=sk-ant-xxxxx

# At least one image provider
RECRAFT_API_KEY=your_key
# or OPENAI_API_KEY, REPLICATE_API_KEY, etc.
```

### 2. Start Server

```bash
cd backend
python main.py
```

### 3. Use Chat Endpoint

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a sunset over mountains",
    "conversation_id": "user123"
  }'
```

## API Endpoints

### POST `/chat`

Main chat interface for natural language image generation.

**Request:**
```json
{
  "message": "Create a professional headshot of a CEO",
  "conversation_id": "optional-id"
}
```

**Response:**
```json
{
  "message": "I've created a professional corporate headshot for you...",
  "images": [
    "https://..."
  ],
  "actions_taken": [
    "generate_image"
  ],
  "conversation_id": "user123"
}
```

### GET `/providers`

List all available providers and their capabilities.

**Response:**
```json
[
  {
    "name": "recraft",
    "features": ["generate", "upscale", "remove_background", ...],
    "available": true
  }
]
```

### GET `/conversation/{conversation_id}`

Get conversation history.

**Response:**
```json
{
  "conversation_id": "user123",
  "messages": [
    {
      "role": "user",
      "content": "Create a sunset",
      "timestamp": "2024-01-01T10:00:00",
      "images": []
    },
    {
      "role": "assistant",
      "content": "I've created a beautiful sunset...",
      "timestamp": "2024-01-01T10:00:05",
      "images": ["https://..."]
    }
  ]
}
```

### DELETE `/conversation/{conversation_id}`

Clear conversation history.

## Example Conversations

### Simple Generation

```
User: "a cute robot"

Orchestrator:
- Enhances: "A cute friendly robot character, digital illustration, 
             soft colors, detailed, high quality"
- Provider: recraft (fast, good quality)
- Result: Generated image

Response: "I've created a cute robot for you! The image shows..."
```

### Multi-Step Workflow

```
User: "Generate a mountain landscape and upscale it 2x"

Orchestrator:
- Step 1: generate_image (provider: recraft)
- Step 2: upscale_image (provider: recraft, crisp)
- Result: High-quality upscaled image

Response: "I've generated a beautiful mountain landscape and upscaled it 
          for you. Here's the high-resolution result!"
```

### Smart Provider Selection

```
User: "Create a logo with the text 'ACME Inc'"

Orchestrator:
- Detects: Needs text in image
- Chooses: google-imagen (best for text rendering)
- Enhances: "Professional logo design with text 'ACME Inc'..."
- Result: Logo with perfect text

Response: "I've created a professional logo with clear text..."
```

### Context-Aware

```
User: "Create a red car"
Assistant: [generates red car]

User: "Make it blue instead"
Assistant: 
- Understands: Referring to previous image
- Uses: image_to_image tool
- Changes: Color while keeping structure
- Result: Same car, now blue
```

## Available Tools

The orchestrator has access to these tools:

| Tool | Description | Best Providers |
|------|-------------|----------------|
| `generate_image` | Create new image from prompt | recraft, openai, replicate, google-imagen |
| `upscale_image` | Increase resolution | recraft, google-imagen, replicate |
| `edit_image` | Modify existing image | google-imagen, openai, replicate |
| `image_to_image` | Transform while keeping structure | recraft, openai, replicate |
| `remove_background` | Remove background | recraft |
| `replace_background` | Change background | recraft |
| `vectorize_image` | Convert to vector | recraft |
| `list_providers` | Show available providers | - |

## Provider Selection Logic

The orchestrator intelligently selects providers based on:

### For Text in Images
→ **google-imagen** (best text rendering)

### For Highest Quality
→ **replicate** (Flux models)

### For Speed
→ **recraft** or **replicate** (flux-schnell)

### For Creativity
→ **openai** (DALL-E 3)

### For Background Operations
→ **recraft** (only provider with this)

### For Vectorization
→ **recraft** (only provider with this)

## Prompt Enhancement

The orchestrator automatically enhances vague prompts:

| User Input | Enhanced Prompt |
|------------|-----------------|
| "a cat" | "A photorealistic cat with detailed fur, sitting comfortably, natural lighting, professional photography, high quality, 4K" |
| "logo" | "Modern minimalist professional logo design, vector art, clean lines, corporate branding, white background" |
| "mountain" | "Majestic mountain landscape, dramatic peaks, golden hour lighting, professional landscape photography, 8K, ultra detailed" |

## Configuration

### Orchestrator Settings

```python
from orchestrator import LLMOrchestrator

# Custom configuration
orchestrator = LLMOrchestrator(
    api_key="your-claude-key",
    model="claude-3-5-sonnet-20241022",  # or claude-3-opus, etc.
)

# Process message
result = await orchestrator.process_message(
    message="Create an image",
    conversation_id="user123",
    max_iterations=5  # Max tool calls per message
)
```

### System Prompt Customization

Edit `orchestrator/llm_orchestrator.py` to customize the system prompt and provider selection logic.

## Frontend Integration

### Update Your Chat Component

```javascript
// frontend/src/components/AIChatPanel.jsx

const handleSubmit = async () => {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: prompt,
      conversation_id: sessionId  // Maintain conversation
    })
  });
  
  const data = await response.json();
  
  // Show AI response
  console.log(data.message);
  
  // Display images
  data.images.forEach(url => {
    addAIImage(url);
  });
  
  // Show what happened
  console.log("Actions:", data.actions_taken);
};
```

## Advanced Features

### Conversation Context

```python
# The orchestrator remembers:
- Previous images generated
- User preferences
- Recent operations
- Conversation flow

# Access context
conversation = orchestrator.get_conversation_history("user123")
```

### Error Handling

```python
try:
    result = await orchestrator.process_message(
        "Generate an image",
        conversation_id="user123"
    )
except Exception as e:
    # Orchestrator handles most errors internally
    # and tries alternative approaches
    print(f"Unrecoverable error: {e}")
```

### Multi-Turn Conversations

```python
# Turn 1
result1 = await orchestrator.process_message(
    "Create a red sports car",
    conversation_id="user123"
)

# Turn 2 - references previous image
result2 = await orchestrator.process_message(
    "Make it blue and add racing stripes",
    conversation_id="user123"
)
# Orchestrator understands context!
```

## Performance & Cost

### Speed
- LLM call: ~1-2 seconds
- Image generation: 2-60 seconds (provider dependent)
- Total: 3-62 seconds typical

### Cost Per Request
- Claude API: ~$0.01-0.03 per message
- Image generation: $0.003-0.08 (provider dependent)
- **Total: ~$0.02-0.11 per request**

Worth it for:
- Better user experience
- Smarter provider selection
- Automatic prompt enhancement
- Multi-step workflows

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### "No providers configured"
```bash
# Add at least one provider
RECRAFT_API_KEY=xxx
# or OPENAI_API_KEY, REPLICATE_API_KEY, etc.
```

### Slow responses
```python
# Reduce max_iterations
result = await orchestrator.process_message(
    message="...",
    max_iterations=3  # Default is 5
)
```

### Want to bypass orchestrator
```python
# Use provider_manager directly
from providers import provider_manager

result = await provider_manager.generate_image(
    prompt="exact prompt",
    provider="recraft"
)
```

## Architecture Benefits

✅ **Natural Language** - Users speak normally  
✅ **Smart Routing** - Best provider auto-selected  
✅ **Prompt Enhancement** - Better results automatically  
✅ **Multi-Step** - Complex workflows made simple  
✅ **Context Aware** - Remembers conversation  
✅ **Error Resilient** - Graceful fallbacks  
✅ **Extensible** - Easy to add new tools  

## Next Steps

1. **Test it**: Send chat requests and see the magic
2. **Integrate**: Update your frontend to use `/chat` endpoint
3. **Customize**: Adjust system prompt for your use case
4. **Monitor**: Track which providers work best
5. **Extend**: Add custom tools for your specific needs

---

**Status**: ✅ LLM Orchestrator complete and ready to use!

The system is fully functional with natural language understanding, smart provider selection, and conversation memory.


