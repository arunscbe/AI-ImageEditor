# Provider Configuration & Prompts

Centralized configuration and prompt management for all providers and orchestrators.

## Files

### `configuration.py`
Centralized configuration for all providers, orchestrators, and image storage.

### `prompts.py`
Centralized prompt templates for all providers and orchestrators.

---

## Configuration Classes

### `ProviderConfig`
**Provider-specific settings with enable/disable toggles**

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_ENABLED` | `true` | Enable/disable Gemini provider |
| `RECRAFT_ENABLED` | `true` | Enable/disable Recraft provider |
| `OPENAI_ENABLED` | `true` | Enable/disable OpenAI provider |
| `REPLICATE_ENABLED` | `false` | Enable/disable Replicate provider |
| `GOOGLE_IMAGEN_ENABLED` | `false` | Enable/disable Google Imagen provider |
| `DEFAULT_PROVIDER_GENERATE` | `gemini` | Default provider for image generation |
| `DEFAULT_PROVIDER_EDIT` | `gemini` | Default provider for image editing |
| `DEFAULT_PROVIDER_UPSCALE` | `gemini` | Default provider for upscaling |
| `DEFAULT_PROVIDER_VECTORIZE` | `recraft` | Default provider for vectorization (recraft only) |
| `DEFAULT_PROVIDER_ERASE` | `recraft` | Default provider for erase region (recraft only) |
| `DEFAULT_PROVIDER_ANALYZE` | `gemini` | Default provider for image analysis (gemini only) |

#### Usage Example

```python
from providers.configuration import provider_config

# Check if provider is enabled
if provider_config.is_provider_enabled("gemini"):
    # Use Gemini
    pass

# Get enabled providers
enabled = provider_config.get_enabled_providers()
# Returns: ["gemini", "recraft", "openai"]

# Get fallback provider
fallback = provider_config.get_fallback_provider("generate")
# Returns first available provider for generation
```

---

### `OrchestratorConfig`
**Orchestrator settings for Claude and OpenAI orchestrators**

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ORCHESTRATOR_TYPE` | `openai` | Which orchestrator to use (`claude` or `openai`) |
| `CLAUDE_MODEL` | `claude-3-5-sonnet-20241022` | Claude model for orchestration |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model for orchestration |
| `ANALYSIS_ENABLED` | `true` | Enable automatic image analysis |
| `AUTO_UPSCALE_THRESHOLD` | `1024` | Min resolution before auto-upscale |

#### Usage Example

```python
from providers.configuration import orchestrator_config

# Get max iterations
max_iter = orchestrator_config.DEFAULT_ITERATIONS  # 5

# Check if should analyze
should_analyze = orchestrator_config.should_auto_analyze(
    message="vectorize this image", 
    has_image_url=True
)
```

---

### `ImageStorageConfig`
**Image storage and naming conventions**

#### Configuration

| Attribute | Value | Description |
|-----------|-------|-------------|
| `PREFIX_FINAL` | `final_` | Prefix for final output images |
| `PREFIX_TEMP` | `temp_` | Prefix for temporary/intermediate images |
| `PREFIX_UPLOAD` | `upload_` | Prefix for user uploads |
| `PREFIX_SVG` | `svg_` | Prefix for SVG files |

#### Usage Example

```python
from providers.configuration import storage_config

# Image naming
# final_<uuid>.png
# temp_<uuid>.png
# upload_<uuid>.ext
```

---

## Prompt Classes

### `ProviderPrompts`
**Provider-specific prompt templates**

#### Available Prompts

- **`GEMINI_ANALYSIS_PROMPT`**: Image analysis prompt for Gemini vision
- **`GEMINI_EMBROIDERY_STYLE`**: Embroidery style generation prompt
- **`GEMINI_LEATHER_STYLE`**: Leather deboss/emboss style prompt
- **`GEMINI_SCREEN_PRINT_STYLE`**: Screen print style prompt

#### Usage Example

```python
from providers.prompts import provider_prompts

# Get analysis prompt
analysis_prompt = provider_prompts.GEMINI_ANALYSIS_PROMPT

# Get style-specific prompt
style_prompt = provider_prompts.get_style_prompt(
    style="leather",
    leather_color="cognac brown",
    ink_color="gold embossed"
)
```

---

### `OrchestratorPrompts`
**Orchestrator system prompt templates**

#### Methods

- **`build_orchestrator_system_prompt()`**: Build complete system prompt with current config
- **`build_auto_analysis_prefix()`**: Create message prefix for auto-analysis
- **`format_providers_info()`**: Format provider list for display
- **`get_provider_descriptions()`**: Get provider capability descriptions

#### Usage Example

```python
from providers.prompts import orchestrator_prompts
from providers.provider_manager import provider_manager

# Build system prompt
providers = provider_manager.list_providers()
providers_info = orchestrator_prompts.format_providers_info(providers)

system_prompt = orchestrator_prompts.build_orchestrator_system_prompt(
    providers_info=providers_info,
    default_generate="gemini",
    default_vectorize="recraft"
)
```

---

## Quick Reference

### Disabling a Provider

```bash
# In .env file
GEMINI_ENABLED=false
```

### Changing Default Providers

```bash
# In .env file
DEFAULT_PROVIDER_GENERATE=recraft
DEFAULT_PROVIDER_UPSCALE=replicate
```

### Custom Models

```bash
# In .env file
GEMINI_DEFAULT_MODEL=gemini-1.5-pro
OPENAI_MODEL=gpt-4o
```

---

## Benefits

✅ **Single Source of Truth**: All configuration in one place  
✅ **Easy Toggle**: Enable/disable providers without code changes  
✅ **Fallback Support**: Automatic fallback to available providers  
✅ **Environment Driven**: All settings configurable via .env  
✅ **Type Safe**: Clear configuration classes with documentation  
✅ **Maintainable**: Update prompts without touching orchestrator code  

---

## Migration from Old Code

**Before:**
```python
# Scattered across multiple files
model = "gpt-4o-mini"
prefix = "gemini_gen"
prompt = "Long hardcoded prompt..."
```

**After:**
```python
from providers.configuration import orchestrator_config, storage_config
from providers.prompts import orchestrator_prompts

model = orchestrator_config.OPENAI_ORCHESTRATOR_MODEL
prefix = storage_config.PREFIX_FINAL
prompt = orchestrator_prompts.build_orchestrator_system_prompt(...)
```

---

For questions or issues, check the code documentation in:
- `backend/providers/configuration.py`
- `backend/providers/prompts.py`

