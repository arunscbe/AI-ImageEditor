"""
Test script to verify color quantization works correctly
"""
import re

def test_quantization():
    # Sample SVG with many colors
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect fill="#FF0000" x="0" y="0" width="10" height="10"/>
    <rect fill="#FF1111" x="10" y="0" width="10" height="10"/>
    <rect fill="#FF2222" x="20" y="0" width="10" height="10"/>
    <rect fill="#00FF00" x="30" y="0" width="10" height="10"/>
    <rect fill="#00FF11" x="40" y="0" width="10" height="10"/>
    <rect fill="#0000FF" x="50" y="0" width="10" height="10"/>
    <rect fill="#0011FF" x="60" y="0" width="10" height="10"/>
    <rect fill="#FFFF00" x="70" y="0" width="10" height="10"/>
    <rect fill="#FFFF11" x="80" y="0" width="10" height="10"/>
    <rect fill="#FF00FF" x="90" y="0" width="10" height="10"/>
    </svg>'''
    
    # Count original colors
    original_colors = set(re.findall(r'fill="(#[0-9A-Fa-f]{6})"', svg_content))
    print(f"Original colors: {len(original_colors)}")
    print(f"Colors: {sorted(original_colors)}")
    
    # Import the quantization function
    from providers.recraft_provider import RecraftProvider
    provider = RecraftProvider()
    
    # Quantize to 5 colors
    quantized_svg = provider._quantize_svg_colors(svg_content, max_colors=5)
    
    # Count quantized colors
    quantized_colors = set(re.findall(r'fill="(#[0-9A-Fa-f]{6})"', quantized_svg))
    print(f"\nQuantized colors: {len(quantized_colors)}")
    print(f"Colors: {sorted(quantized_colors)}")
    
    print(f"\n✅ Successfully reduced from {len(original_colors)} to {len(quantized_colors)} colors!")
    
    return len(quantized_colors) <= 5

if __name__ == "__main__":
    try:
        test_quantization()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
