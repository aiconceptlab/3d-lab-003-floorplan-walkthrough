# Build the experiment

## 1. One scene description

`public/sample/apartment.json` defines a 9 × 8 m footprint, 2.8 m wall height, four room rectangles, wall centre-line segments and furniture footprints. x increases right and z increases down the drawing. Distances are metres. Walls have explicit door gaps. `src/plan.mjs` validates finite bounds, list limits, furniture IDs and rotated footprints before geometry is created. Unknown fields are discarded; labels are escaped.

Furniture is generated from simple shapes with softened edges: cushions, bedding, chair legs, handles, taps and accessories. It is intentionally editable and lightweight. The sample floor plan is authored example data, not a survey. East-wall window panels are decorative assumptions, not structural openings inferred from the image. Collision uses wall distances and primary furniture footprints; accessories and individual chair legs are not navigation obstacles.

## 2. Materials and light

`src/materials.mjs` assigns distinct physical surfaces:

| Surface | Roughness | Finish |
| --- | ---: | --- |
| Oak | 0.43 | Directional procedural grain, subtle 0.16 clearcoat |
| Linen | 0.95 | Fine weave bump, 0.35 fabric sheen |
| Plaster | 0.93 | Restrained micro-bump, no glossy coating |
| Stone/ceramic | 0.26 | Broad specular highlights, subtle clearcoat |
| Brushed fixtures | 0.31 | 0.88 metalness |
| Shower glass | 0.08 | Transparent reflective surface |

Warm directional light, cooler fill and a low-intensity room environment give different surfaces different reflections. ACES tone mapping protects highlights. These are real-time PBR approximations, not a path-traced lighting simulation. The generated film provides the photorealistic cinematic treatment. Procedural bump textures do not transfer through glTF's standard material model; base colours, roughness, metalness and supported extensions do.

## 3. Optional AI interpretation

The browser sends the image only after Extract is clicked. `server.mjs` uses the official OpenAI Responses image-input and strict structured-output pattern, with `store: false`. Supplied footprint dimensions are enforced after generation. A schema-valid output still needs human review: shape validation is not proof that an image was understood correctly.

The provider key stays server-side. Responses never include it. The local server rejects cross-origin extraction, invalid Host headers, oversized bodies, unsupported files, missing app tokens and concurrent jobs. No image persistence is implemented.

## 4. Higgsfield cinematic preview

The supplied floor-plan image was used to generate one interior still. That still became the start frame for one slow, continuous eight-second architectural camera move. See [generation record](docs/generation.md). Reproduce manually with the included prompts or download a fresh brief from the app. This free code does not include free provider usage.

Keep the generative preview labelled: it can alter walls, furniture or proportions. Never read dimensions from video pixels. The displayed table comparison comes from the JSON geometry only.

## 5. Blender handoff

Click **3D model (.glb)**, then use Blender's glTF import or the optional script in `blender/`. The script adds a camera, Cycles settings and area lights. Adjust its sample camera for a different apartment. A generated mood film and a geometry-faithful Blender render are separate outputs; only the former is included in this release.

## 6. Rebuild and publish

```sh
npm ci
npm run check
npm run instagram
```

Inspect all five PNGs at 1080 × 1350. Upload in filename order; choose 4:5 for the first image. The 72 px content margin keeps the brand and footer inside the canvas. Use `marketing/caption.txt`; the final slide asks viewers to comment CODE.

Before publishing, scan the source and staged files for secrets, confirm `.env` is ignored, and exclude `node_modules`, `dist` and local access tokens. The repository intentionally includes only sample data, not user floor plans.

## Official references (checked 13 September 2026)

- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [Three.js documentation](https://threejs.org/docs/)
- [Higgsfield Blender plugin](https://higgsfield.ai/plugins/blender)

Higgsfield's Blender workflow inspired this experiment. A connected Higgsfield generation tool does not itself establish a local Blender connection. This release does not claim to have run Astra inside Blender.
