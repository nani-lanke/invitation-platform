from PIL import Image
import os

def remove_white_background(input_path, output_path):
    img = Image.open(input_path).convert("RGB")
    width, height = img.size

    # Create RGBA image
    rgba = Image.new("RGBA", (width, height))
    pixels = rgba.load()
    src_pixels = img.load()

    for y in range(height):
        for x in range(width):
            r, g, b = src_pixels[x, y]
            # Use simple luminance-based thresholding or direct color check
            # For pure white backgrounds, direct RGB check works well.
            # Using a slightly higher threshold (e.g. 240) to be safe.

            if r > 240 and g > 240 and b > 240:
                # Transparent
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Keep color, adjust alpha slightly based on brightness for soft edges
                # or just keep 255 if clearly a subject pixel.
                # Simplest approach: just set alpha 255 for non-white
                # Let's try to preserve anti-aliasing if possible.

                # Simple alpha-based refinement (not strictly necessary if generation is good)
                pixels[x, y] = (r, g, b, 255)

    rgba.save(output_path, "PNG")
    print(f"Processed white background removal for {output_path}")

input_dir = "images/ceremony-icons"
for name in ['haldi.png', 'mehndi.png', 'wedding.png', 'reception.png']:
    p = os.path.join(input_dir, name)
    if os.path.exists(p):
        remove_white_background(p, p)
    else:
        print(f"File not found: {p}")
