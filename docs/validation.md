# Release validation — 13 September 2026

## All-room tour revision

- Eleven Node tests pass, including clear routes for both table sizes, coverage of every sample room, a custom two-room plan, and rejection of a sealed bathroom doorway.
- The sample guided route runs for 50.3 seconds, through the entrance/dining area, kitchen, living area, main bedroom, bathroom and bedroom/study. Automatic completion, pause, room jumps, scrubbing and replay were exercised in the browser.
- Navigation checks walls, furniture and a conservative dining-chair footprint. It reports an obstructed/unreachable route rather than travelling through a wall.
- The cinematic asset is now 32 seconds: four eight-second Higgsfield clips with room labels and cuts. Three additional stills and three additional clips cost 45 credits, with no paid retries. The earlier eight-second living clip is reused.
- The five Instagram slides remain 1080 × 1350 (4:5); the room slide now shows both bedrooms and the bathroom.

The checks below describe the initial release; its eight-second film has been superseded by this revision.

## Passed

- Seven Node tests: sample geometry and independent table gaps; invalid/out-of-bounds/duplicate geometry; escaped labels and field filtering; Responses API strict-image contract; missing credentials/provider errors/refusal; local server token/origin/dotfile protection; rejection of a mismatched generated scale.
- Production build completed. The 624 kB JavaScript bundle includes Three.js; Vite reports a size advisory, not a build failure.
- `npm audit --registry=https://registry.npmjs.org --audit-level=high`: zero known vulnerabilities in the locked dependency set at audit time.
- Browser: sample rendered, both table choices displayed 0.95/0.65 m, eye-level camera rendered, and GLB export reported success.
- Browser: uploaded JSON required review before replacing the scene; custom plans disabled the sample comparison; malformed JSON geometry showed an error without replacing the scene.
- Browser: image upload stayed in the local reference flow; extraction was disabled with an explicit explanation when no server key was configured.
- Responsive check: 390 px viewport, document scroll width 375 px; no horizontal overflow. Desktop and model screenshots inspected.
- Five carousel PNGs rendered at exactly 1080 × 1350. Contact sheet inspected; cover and footer stay within the canvas.
- Genuine Higgsfield video completed and played as eight seconds; start, middle and end views inspected. One still plus one video cost 15 credits total. No retry generations.
- Blender handoff script passed Python syntax compilation.
- Gitleaks scanned staged publication files with redacted reporting and found no leaks. This is a point-in-time automated check, not a guarantee against every possible secret.

## Explicit limits

- Live OpenAI image extraction was not executed: no API key was configured. The live API contract and failure paths were exercised using fixtures.
- Blender was not installed, so a Blender render/import was not executed. GLB export was exercised in the browser; the optional script is supplied as an unexecuted handoff.
- Generated footage is not a surveyed reconstruction and changed details such as chair count. No claim is made about dimensional fidelity, building compliance or physical simulation accuracy.
- Navigation collision uses simplified wall/furniture footprints. Decorative windows, accessories and chair-leg geometry are not independently surveyed features.
- Phone-size layout testing does not substitute for an actual Instagram upload or every mobile GPU/browser.
