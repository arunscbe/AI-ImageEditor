"""
Test script for the provider system
Run this to verify all providers are working correctly
"""
import asyncio
from providers import provider_manager
from providers.base_provider import ProviderFeature


async def test_providers():
    print("=" * 60)
    print("AI Image Editor - Provider System Test")
    print("=" * 60)
    print()
    
    print("1. Listing available providers...")
    print("-" * 60)
    providers = provider_manager.list_providers()
    
    if not providers:
        print("No providers configured!")
        print("Please set API keys in .env file")
        return
    
    for provider in providers:
        print(f"{provider['name'].upper()}")
        print(f"   Features: {', '.join(provider['features'])}")
        print()
    
    print("\n2. Testing provider capabilities...")
    print("-" * 60)
    
    for feature in ProviderFeature:
        providers_with_feature = provider_manager.get_providers_by_feature(feature)
        if providers_with_feature:
            print(f"{feature.value}: {', '.join(providers_with_feature)}")
    
    print("\n3. Testing image generation (if provider available)...")
    print("-" * 60)
    
    if provider_manager.providers:
        test_provider = list(provider_manager.providers.keys())[0]
        print(f"Using provider: {test_provider}")
        
        try:
            result = await provider_manager.generate_image(
                prompt="A small red cube on a white background, simple 3D render",
                provider=test_provider,
                size="1024x1024"
            )
            
            print(f"Generation successful!")
            print(f"Provider: {result['provider']}")
            print(f"Images: {len(result['data'].get('images', []))}")
            
            if result['data'].get('images'):
                print(f"Image URL: {result['data']['images'][0]['url'][:80]}...")
        
        except Exception as e:
            print(f"Generation failed: {e}")
    
    print("\n4. Best provider recommendations...")
    print("-" * 60)
    
    best_for_generate = provider_manager.get_best_provider_for_feature(
        ProviderFeature.GENERATE,
        preferred=["recraft", "openai", "replicate"]
    )
    print(f"Best for generation: {best_for_generate}")
    
    best_for_upscale = provider_manager.get_best_provider_for_feature(
        ProviderFeature.UPSCALE,
        preferred=["recraft", "replicate"]
    )
    print(f"Best for upscaling: {best_for_upscale}")
    
    best_for_vectorize = provider_manager.get_best_provider_for_feature(
        ProviderFeature.VECTORIZE
    )
    print(f"Best for vectorization: {best_for_vectorize}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)


async def test_specific_provider(provider_name: str, prompt: str):
    print(f"\nTesting {provider_name} with prompt: '{prompt}'")
    print("-" * 60)
    
    try:
        result = await provider_manager.generate_image(
            prompt=prompt,
            provider=provider_name
        )
        
        print(f"Success!")
        print(f"Provider: {result['provider']}")
        print(f"Images generated: {len(result['data'].get('images', []))}")
        
        for i, img in enumerate(result['data'].get('images', [])):
            print(f"  Image {i+1}: {img['url']}")
        
        return result
    
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    print("\nStarting provider system tests...\n")
    
    asyncio.run(test_providers())
    
    print("\n\nTo test a specific provider, uncomment one of these lines:")
    print("# asyncio.run(test_specific_provider('recraft', 'A sunset over mountains'))")
    print("# asyncio.run(test_specific_provider('openai', 'A cute robot drawing'))")
    print("# asyncio.run(test_specific_provider('replicate', 'A fantasy landscape'))")


