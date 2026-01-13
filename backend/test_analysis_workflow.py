"""
Test script for the intelligent image analysis workflow.
Tests the complete pipeline: analyze → upscale (if needed) → vectorize (if suitable)
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from providers.provider_manager import provider_manager
from orchestrator.llm_orchestrator import get_orchestrator


async def test_direct_analysis():
    """Test direct image analysis call"""
    print("\n" + "="*60)
    print("TEST 1: Direct Image Analysis")
    print("="*60)
    
    # Test with a sample image URL (you can replace with your own)
    test_image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png"
    
    try:
        print(f"\nAnalyzing image: {test_image_url}")
        result = await provider_manager.analyze_image(
            image_url=test_image_url,
            provider="gemini"
        )
        
        print("\n✅ Analysis Results:")
        print("-" * 60)
        
        if "data" in result:
            analysis = result["data"].get("analysis", {})
        else:
            analysis = result.get("analysis", {})
        
        # Print technical details
        if "technical" in analysis:
            tech = analysis["technical"]
            print(f"\n📊 Technical Details:")
            print(f"   Resolution: {tech.get('resolution')}")
            print(f"   Format: {tech.get('format')}")
            print(f"   Color Mode: {tech.get('color_mode')}")
            print(f"   Estimated Colors: {tech.get('estimated_colors')}")
            print(f"   File Size: {tech.get('file_size_kb')} KB")
        
        # Print AI assessment
        if "ai_assessment" in analysis:
            print(f"\n🤖 AI Assessment:")
            print(f"   {analysis['ai_assessment']}")
        
        # Print recommendations
        if "recommendations" in analysis:
            rec = analysis["recommendations"]
            print(f"\n💡 Recommendations:")
            print(f"   Actions: {', '.join(rec.get('actions', []))}")
            print(f"   Needs Upscale: {rec.get('needs_upscale')}")
            print(f"   Suitable for Vectorization: {rec.get('suitable_for_vectorization')}")
            print(f"   Vectorization Score: {rec.get('vectorization_score')}")
            if "reasons" in rec:
                print(f"   Reasons:")
                for reason in rec["reasons"]:
                    print(f"      - {reason}")
        
        # Print optimal workflow
        if "optimal_workflow" in analysis:
            wf = analysis["optimal_workflow"]
            print(f"\n🔄 Optimal Workflow:")
            print(f"   Name: {wf.get('name')}")
            print(f"   Description: {wf.get('description')}")
            print(f"   Steps: {', '.join(wf.get('steps', []))}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def test_orchestrator_workflow():
    """Test the complete orchestrator workflow with analysis"""
    print("\n" + "="*60)
    print("TEST 2: Orchestrator Intelligent Workflow")
    print("="*60)
    
    try:
        orchestrator = get_orchestrator()
        
        # Test message with image URL
        test_image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Android_O_Preview_Logo.png/320px-Android_O_Preview_Logo.png"
        
        message = f"I have this image that I want to convert to SVG: {test_image_url}. Can you help me get the best quality SVG?"
        
        print(f"\n📤 User Message: {message}")
        print("\n⏳ Processing (orchestrator will analyze, then process)...")
        
        result = await orchestrator.process_message(
            message=message,
            conversation_id="test_analysis_workflow",
            max_iterations=10  # Allow multiple tool calls
        )
        
        print("\n✅ Orchestrator Response:")
        print("-" * 60)
        print(f"Message: {result.get('message', 'No message')}")
        print(f"\nActions Taken: {', '.join(result.get('actions_taken', []))}")
        print(f"Images Generated: {len(result.get('images', []))}")
        
        if result.get('images'):
            print("\n🖼️ Output Images:")
            for i, img_url in enumerate(result['images'], 1):
                print(f"   {i}. {img_url}")
        
        if result.get('tool_results'):
            print("\n🔧 Tool Results:")
            for i, tool_result in enumerate(result['tool_results'], 1):
                tool_name = tool_result.get('tool', 'unknown')
                success = tool_result.get('success', False)
                status = "✅" if success else "❌"
                print(f"   {status} {i}. {tool_name}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error during orchestrator test: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def test_complete_workflow():
    """Test complete workflow: low-res image → analyze → upscale → vectorize"""
    print("\n" + "="*60)
    print("TEST 3: Complete Workflow (Low-Res → Upscale → Vectorize)")
    print("="*60)
    
    # This would ideally use a small logo image that needs upscaling
    test_image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/120px-Google_%22G%22_Logo.svg.png"
    
    try:
        print(f"\n📊 Step 1: Analyze image")
        analysis_result = await provider_manager.analyze_image(
            image_url=test_image_url,
            provider="gemini"
        )
        
        analysis = analysis_result.get("data", {}).get("analysis", {}) or analysis_result.get("analysis", {})
        recommendations = analysis.get("recommendations", {})
        
        print(f"   Needs upscale: {recommendations.get('needs_upscale')}")
        print(f"   Suitable for vectorization: {recommendations.get('suitable_for_vectorization')}")
        
        current_url = test_image_url
        
        # Step 2: Upscale if recommended
        if recommendations.get('needs_upscale'):
            print(f"\n📈 Step 2: Upscaling image")
            upscale_result = await provider_manager.upscale_image(
                image_url=current_url,
                provider="recraft",
                upscale_type="crisp"
            )
            
            if upscale_result.get("data", {}).get("images"):
                current_url = upscale_result["data"]["images"][0]["url"]
                print(f"   ✅ Upscaled: {current_url}")
            else:
                print(f"   ⚠️ Upscale returned no images, using original")
        
        # Step 3: Vectorize if suitable
        if recommendations.get('suitable_for_vectorization'):
            print(f"\n🔄 Step 3: Vectorizing image")
            vectorize_result = await provider_manager.vectorize_image(
                image_url=current_url,
                provider="recraft"
            )
            
            if vectorize_result.get("data", {}).get("images"):
                svg_url = vectorize_result["data"]["images"][0]["url"]
                print(f"   ✅ Vectorized: {svg_url}")
            else:
                print(f"   ⚠️ Vectorization returned no images")
        
        print(f"\n✅ Complete workflow finished successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during complete workflow: {str(e)}")
        import traceback
        traceback.print_exc()


async def main():
    print("\n" + "="*60)
    print("🚀 IMAGE ANALYSIS WORKFLOW TEST SUITE")
    print("="*60)
    print("\nThis test suite verifies the intelligent image processing pipeline:")
    print("  • Image analysis with Gemini vision")
    print("  • Automatic upscaling for low-resolution images")
    print("  • Intelligent vectorization for suitable images")
    print("  • Complete orchestration workflow")
    
    # Check for required API keys
    required_keys = ["GEMINI_API_KEY", "ANTHROPIC_API_KEY", "RECRAFT_API_KEY"]
    missing_keys = [key for key in required_keys if not os.getenv(key)]
    
    if missing_keys:
        print(f"\n⚠️  WARNING: Missing API keys: {', '.join(missing_keys)}")
        print("Some tests may fail. Please set these in your .env file.")
    
    # Run tests
    await test_direct_analysis()
    await test_orchestrator_workflow()
    await test_complete_workflow()
    
    print("\n" + "="*60)
    print("✅ TEST SUITE COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())

