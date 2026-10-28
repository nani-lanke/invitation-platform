# InviteAura Local AI Isolated Asset Generator (Admin / Developer Only)

This folder houses the Admin/Developer-only generation pipeline connecting local
ComfyUI + FLUX.2 Klein 4B to generate individual, isolated 32-bit transparent PNG decorative assets.

> **CRITICAL ARCHITECTURAL RULE**:
> - **NEVER** generate a single composite invitation background.
> - **NEVER** combine multiple decorative elements into one image.
> - Every generation produces **ONE isolated, 32-bit transparent PNG decorative asset**.
> - The website dynamically layers these individual PNG assets over solid parchment HTML/CSS.

---

## 1. Start ComfyUI

ComfyUI must be running locally:

```text
http://127.0.0.1:8188
```

with the required model files:

```text
ComfyUI/models/diffusion_models/flux-2-klein-4b.safetensors
ComfyUI/models/text_encoders/qwen_3_4b.safetensors
ComfyUI/models/vae/flux2-vae.safetensors
```

---

## 2. Developer Generation Workflow

### Option A: Generate a Single Specific Asset
From the project root:

```bash
# Generate only the isolated Lord Vinayaka asset
npm run ai:bg-generate -- --template telugu-pelli --asset vinayaka

# Generate only the left ceremonial elephant
npm run ai:bg-generate -- --template telugu-pelli --asset elephant-left

# Generate only the floral corner
npm run ai:bg-generate -- --template telugu-pelli --asset flower-top-left
```

### Option B: Generate the Entire Asset Library for a Template

```bash
# Generate all 14 isolated assets for Telugu Pelli
npm run ai:bg-generate -- --template telugu-pelli --all
```

The script:
1. Prompts FLUX.2 Klein 4B via ComfyUI (`127.0.0.1:8188`) with single-object prompts.
2. Saves each isolated transparent image as `images/invitation-assets/<template>/<asset>.png`.

---

## 3. Asset Inventory (`images/invitation-assets/telugu-pelli/`)

| Asset File | Description | Dimensions |
| :--- | :--- | :--- |
| `vinayaka.png` | Centered, front-facing Lord Vinayaka with gold jewelry details | 768 × 768 |
| `elephant-left.png` | Ceremonial elephant facing inward toward right, emerald-gold caparison | 768 × 768 |
| `elephant-right.png` | Ceremonial elephant facing inward toward left, emerald-gold caparison | 768 × 768 |
| `flower-top-left.png` | Corner floral arrangement with jasmine and mango leaves | 768 × 768 |
| `flower-top-right.png` | Corner floral arrangement with jasmine and mango leaves | 768 × 768 |
| `flower-left.png` | Vertical side floral vine with white and blush blossoms | 512 × 1024 |
| `flower-right.png` | Vertical side floral vine with white and blush blossoms | 512 × 1024 |
| `temple-left.png` | Sandstone temple pavilion illustration | 512 × 768 |
| `temple-right.png` | Sandstone temple pavilion illustration | 512 × 768 |
| `lake-bottom.png` | Subtle horizontal calm temple water with ripples and reflections | 1024 × 384 |
| `lotus.png` | Blooming pink Indian lotus bloom with green pad leaves | 512 × 512 |
| `frame.png` | Thin antique gold border frame with transparent center | 1024 × 1536 |
| `bells-left.png` | Suspended brass temple bells on golden beaded chains | 384 × 768 |
| `bells-right.png` | Suspended brass temple bells on golden beaded chains | 384 × 768 |

---

## 4. Website Modular Layering Architecture

The website **never** relies on a single background bitmap:

```text
Solid Parchment (#FAF5EC)
  + frame.png
  + vinayaka.png
  + flower-top-left.png
  + flower-top-right.png
  + flower-left.png
  + flower-right.png
  + bells-left.png
  + bells-right.png
  + temple-left.png
  + temple-right.png
  + lake-bottom.png
  + lotus.png
  + elephant-left.png
  + elephant-right.png
  + Live HTML / CSS Typography & Interactive RSVP / Calendar Buttons
```

Each element is an independent HTML/CSS layer (`pointer-events: none; z-index: 0;`), positioned responsively with `clamp()`, `%`, and `aspect-ratio`.
All interactive controls maintain `pointer-events: auto; z-index: 10;`.
