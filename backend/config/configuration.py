"""
Provider and Orchestrator Configuration
Centralized configuration for all providers and orchestrators
"""
import os
from typing import Dict, Any, List


class ProviderConfig:
    """Provider-specific configuration"""
    
    # Provider enable/disable toggles
    GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "true").lower() == "true"
    RECRAFT_ENABLED = os.getenv("RECRAFT_ENABLED", "true").lower() == "true"
    OPENAI_ENABLED = os.getenv("OPENAI_ENABLED", "true").lower() == "true"
    REPLICATE_ENABLED = os.getenv("REPLICATE_ENABLED", "false").lower() == "true"
    GOOGLE_IMAGEN_ENABLED = os.getenv("GOOGLE_IMAGEN_ENABLED", "false").lower() == "true"
    
    # Provider API keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    RECRAFT_API_KEY = os.getenv("RECRAFT_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    REPLICATE_API_KEY = os.getenv("REPLICATE_API_KEY")
    GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
    
    # Provider-specific settings
    GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "gemini-2.0-flash-exp")
    GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.0-flash-exp")
    GEMINI_VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash-exp")
    
    RECRAFT_BASE_URL = os.getenv("RECRAFT_URL", "https://external.api.recraft.ai/v1")
    RECRAFT_STYLE_DEFAULT = os.getenv("RECRAFT_STYLE_DEFAULT", "realistic_image")
    
    OPENAI_DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "dall-e-3")
    
    # Provider defaults
    DEFAULT_PROVIDER_GENERATE = os.getenv("DEFAULT_PROVIDER_GENERATE", "gemini")
    DEFAULT_PROVIDER_EDIT = os.getenv("DEFAULT_PROVIDER_EDIT", "gemini")
    DEFAULT_PROVIDER_ENHANCE = os.getenv("DEFAULT_PROVIDER_ENHANCE", "gemini")
    DEFAULT_PROVIDER_UPSCALE = os.getenv("DEFAULT_PROVIDER_UPSCALE", "replicate")  # For true upscaling
    DEFAULT_PROVIDER_VECTORIZE = os.getenv("DEFAULT_PROVIDER_VECTORIZE", "recraft")
    DEFAULT_PROVIDER_ERASE = os.getenv("DEFAULT_PROVIDER_ERASE", "recraft")
    DEFAULT_PROVIDER_ANALYZE = os.getenv("DEFAULT_PROVIDER_ANALYZE", "gemini")
    
    @staticmethod
    def get_enabled_providers() -> List[str]:
        """Get list of enabled providers with valid API keys"""
        enabled = []
        if ProviderConfig.GEMINI_ENABLED and ProviderConfig.GEMINI_API_KEY:
            enabled.append("gemini")
        if ProviderConfig.RECRAFT_ENABLED and ProviderConfig.RECRAFT_API_KEY:
            enabled.append("recraft")
        if ProviderConfig.OPENAI_ENABLED and ProviderConfig.OPENAI_API_KEY:
            enabled.append("openai")
        if ProviderConfig.REPLICATE_ENABLED and ProviderConfig.REPLICATE_API_KEY:
            enabled.append("replicate")
        if ProviderConfig.GOOGLE_IMAGEN_ENABLED and ProviderConfig.GOOGLE_PROJECT_ID:
            enabled.append("google-imagen")
        return enabled
    
    @staticmethod
    def is_provider_enabled(provider_name: str) -> bool:
        """Check if a specific provider is enabled and has valid credentials"""
        return provider_name in ProviderConfig.get_enabled_providers()
    
    @staticmethod
    def get_fallback_provider(operation: str) -> str:
        """
        Get fallback provider if default is not available.
        
        Args:
            operation: Operation type (generate, edit, upscale, etc.)
            
        Returns:
            Provider name or None if no suitable provider is available
        """
        enabled = ProviderConfig.get_enabled_providers()
        
        # Define fallback chains for each operation
        fallbacks = {
            "generate": ["gemini", "recraft", "openai", "replicate"],
            "edit": ["gemini", "google-imagen", "openai"],
            "enhance": ["gemini"],  # Gemini for quality enhancement
            "upscale": ["replicate", "google-imagen"],  # For true resolution upscaling
            "vectorize": ["recraft"],  # Only recraft supports this
            "erase": ["recraft"],  # Only recraft supports this
            "analyze": ["gemini"],  # Only gemini supports this
        }
        
        for provider in fallbacks.get(operation, []):
            if provider in enabled:
                return provider
        
        return None


class OrchestratorConfig:
    """Orchestrator configuration"""
    
    # Model settings
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
    OPENAI_ORCHESTRATOR_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Orchestrator selection
    ORCHESTRATOR_TYPE = os.getenv("ORCHESTRATOR_TYPE", "openai").lower()
    
    # Iteration limits
    MAX_ITERATIONS = 10
    DEFAULT_ITERATIONS = 5
    
    # Image processing settings
    ANALYSIS_ENABLED = os.getenv("ANALYSIS_ENABLED", "true").lower() == "true"
    AUTO_UPSCALE_THRESHOLD = int(os.getenv("AUTO_UPSCALE_THRESHOLD", "1024"))
    
    # Auto-analysis triggers
    ANALYSIS_KEYWORDS = [
        'vectorize', 'svg', 'vector', 'convert', 
        'process', 'analyze', 'improve', 'optimize'
    ]
    
    @staticmethod
    def should_auto_analyze(message: str, has_image_url: bool) -> bool:
        """Determine if message should trigger automatic image analysis"""
        if not has_image_url or not OrchestratorConfig.ANALYSIS_ENABLED:
            return False
        
        message_lower = message.lower()
        return any(
            keyword in message_lower 
            for keyword in OrchestratorConfig.ANALYSIS_KEYWORDS
        )


class ImageStorageConfig:
    """Image storage and naming configuration"""
    
    # Storage paths
    STORAGE_DIR = os.getenv("IMAGE_STORAGE_PATH", "generated_images")
    PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL")
    
    # Image naming conventions
    PREFIX_FINAL = "final_"
    PREFIX_TEMP = "temp_"
    PREFIX_UPLOAD = "upload_"
    PREFIX_SVG = "svg_"
    
    # Image processing
    DEFAULT_IMAGE_FORMAT = "PNG"
    DEFAULT_IMAGE_QUALITY = 95
    SVG_ENCODING = "utf-8"


# Singleton instances
provider_config = ProviderConfig()
orchestrator_config = OrchestratorConfig()
storage_config = ImageStorageConfig()

