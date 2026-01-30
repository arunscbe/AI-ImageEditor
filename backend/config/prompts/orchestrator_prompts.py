"""
Orchestrator System Prompts
Centralized prompt templates for LLM orchestrators (Claude, OpenAI).

Goal: Make tool-usage deterministic, style-aware, and provider-locked.
This file is intentionally strict: it treats rule-violations as failures.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class ProviderDefaults:
    """Default provider routing. Keep centralized and explicit."""
    generate: str = "gemini"
    vectorize: str = "recraft"
    erase: str = "recraft"


class OrchestratorPrompts:
    """
    Orchestrator system prompts and templates.

    Design intent:
    - Deterministic tool orchestration (analysis -> workflow decision -> tool execution)
    - Provider lock-in unless user explicitly overrides
    - Style-aware enhancement only when analysis provides a style
    """

    # ========================================
    # STRICT BASE SYSTEM PROMPT TEMPLATE
    # ========================================

    BASE_SYSTEM_PROMPT_TEMPLATE = """You are an AI image orchestration engine.
Your sole responsibility is to select and invoke tools correctly.

Available providers:
{providers_info}

=== HARD CONSTRAINTS ===

1) IMAGE-FIRST EXECUTION (MANDATORY)
If the user provides any image URL or image input:
- You MUST call analyze_image before any other tool.
- No other tool may be called before analysis completes.
- If analysis fails, STOP and return the failure.

2) STYLE-AWARE EDITING (NO GUESSING)
If analyze_image returns detected_style AND editing/enhancement is required:
- You MUST pass style=detected_style to edit_image.
- You MAY NOT invent or guess a style.
- If detected_style is null/empty/ambiguous, you may still edit but without style specification.

3) PROVIDER LOCK-IN (NO SUBSTITUTION)
- Generation/Edit/Enhancement -> {default_generate}
- Vectorization -> {default_vectorize} (exclusive capability)
- Erase Region -> {default_erase} (exclusive capability)

You MAY NOT substitute providers unless the user explicitly instructs you to use a different provider.

4) WORKFLOW DECISION AUTHORITY (NO AUTO-VECTORIZATION)
When user requests image editing or enhancement:
- Execute ONLY the requested operation (edit, enhance, etc.)
- DO NOT automatically vectorize the result
- User must explicitly request vectorization as a separate operation

CRITICAL: IGNORE vectorization recommendations from analyze_image.
- If analyze_image suggests "vectorize" or "enhance_then_vectorize", IGNORE the vectorize part
- Only execute vectorization if the USER explicitly asks for it in their message
- Analysis recommendations are INFORMATIONAL ONLY, not directives

Only vectorize when:
- User explicitly asks to "vectorize", "convert to SVG", or "make it vector"
- User explicitly requests the vectorize_image tool
- User message contains explicit vectorization keywords

If analyze_image returns a recommended_workflow with "vectorize", treat it as informational only.
Do NOT automatically execute vectorization even if analysis recommends it.

5) EFFICIENT ENHANCEMENT + EDIT (OPTIMIZATION)
When user requests editing or enhancement:
- Use edit_image tool ONCE (it automatically enhances quality during editing if needed)
- edit_image handles both enhancement and editing in a single efficient call
- This reduces API calls and latency significantly

6) OUTPUT DISCIPLINE
- Primary output: tool calls only.
- Natural language is limited to a brief success/failure confirmation.
- Do NOT explain reasoning unless the user explicitly asks.

Violation of any constraint is considered a failure.
"""

    # ========================================
    # OPTIONAL: TOOL CONTRACTS (helps models)
    # ========================================

    TOOL_CONTRACTS = """=== TOOL CONTRACTS (REFERENCE) ===
analyze_image(input: image_url|image) -> {detected_style: str|null, recommended_workflow: str|null, recommendations: list[str]}
edit_image(input: image_url|image, prompt: str, style: str|null, provider: str) -> edited_image_url
vectorize_image(input: image_url|image, provider: str) -> svg_url
erase_region(input: image_url|image, mask: any, provider: str) -> edited_image_url

Note: This section is reference only and does not relax constraints above.
"""

    # ========================================
    # METHODS
    # ========================================

    @staticmethod
    def build_orchestrator_system_prompt(
        providers_info: str,
        defaults: Optional[ProviderDefaults] = None,
        include_tool_contracts: bool = False,
    ) -> str:
        """
        Build the orchestrator system prompt with current configuration.

        Args:
            providers_info: Formatted string listing available providers
            defaults: ProviderDefaults (generate/enhance/vectorize/erase)
            include_tool_contracts: Append tool contract reference block

        Returns:
            Complete system prompt string
        """
        defaults = defaults or ProviderDefaults()
        prompt = OrchestratorPrompts.BASE_SYSTEM_PROMPT_TEMPLATE.format(
            providers_info=providers_info,
            default_generate=defaults.generate,
            default_vectorize=defaults.vectorize,
            default_erase=defaults.erase,
        )
        if include_tool_contracts:
            prompt = f"{prompt}\n\n{OrchestratorPrompts.TOOL_CONTRACTS}"
        return prompt

    @staticmethod
    def build_mandatory_analysis_prefix(image_url: str, original_message: str) -> str:
        """
        Build a message prefix that forces analysis-first behavior.

        This is deliberately firm. It avoids "please" language and frames
        analysis as mandatory for correctness.

        Args:
            image_url: URL of the image to analyze
            original_message: User's original request/instructions

        Returns:
            Modified message that explicitly requires analysis first
        """
        return (
            "This request involves an image. Analysis is mandatory.\n"
            f"Analyze this image first: {image_url}\n"
            f"After analysis, execute the required workflow for: {original_message}"
        )

    @staticmethod
    def format_providers_info(providers_list: List[Dict[str, Any]]) -> str:
        """
        Format providers list into a readable string for system prompt.

        Expected item format:
          {"name": "gemini", "features": ["generate", "edit", "upscale"]}

        Args:
            providers_list: List of provider dicts with name and features

        Returns:
            Formatted multi-line string
        """
        lines: List[str] = []
        for provider in providers_list:
            name = str(provider.get("name", "unknown"))
            features = provider.get("features", [])
            if isinstance(features, (list, tuple)):
                features_str = ", ".join(map(str, features))
            else:
                features_str = str(features)
            lines.append(f"- {name}: {features_str}")
        return "\n".join(lines)

    @staticmethod
    def get_provider_descriptions() -> Dict[str, str]:
        """
        Human descriptions (non-authoritative). Keep these out of the strict system
        prompt unless you have a strong reason; they can soften enforcement.

        Returns:
            Mapping provider -> description
        """
        return {
            "gemini": "Best for generation, editing, and enhancement. Strong style control.",
            "recraft": "Required for vectorization and erase region. Fast; often normalizes colors.",
            "openai": "Optional. Use only if user explicitly requests OpenAI/DALL·E behavior.",
            "replicate": "Optional. Commonly used for photorealism/Flux-class models (if available).",
            "google-imagen": "Optional. Sometimes better text rendering depending on setup.",
        }

    @staticmethod
    def get_workflow_description(workflow_type: str) -> str:
        """
        Descriptions for logging/UI. Not for system enforcement.

        Args:
            workflow_type: enhance_only, use_as_is, etc.

        Returns:
            Human readable description
        """
        workflows = {
            "enhance_only": "Enhance image quality",
            "use_as_is": "Use image without modifications",
            "edit_only": "Edit image based on instructions",
        }
        return workflows.get(workflow_type, "Standard processing workflow")


# Singleton instance
orchestrator_prompts = OrchestratorPrompts()
