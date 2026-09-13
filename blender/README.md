# Optional Blender handoff

Export `furnished-apartment.glb` from the app. In Blender choose File → Import → glTF 2.0. The file uses metres and full-height walls. The large presentation ground is excluded.

For an optional Cycles still, run:

```sh
blender --background --python blender/render.py -- --input /absolute/path/furnished-apartment.glb --output /absolute/path/interior.png
```

This script clears the startup scene in that background process, imports the GLB, adds a sample camera and lights, and renders one still. It does not overwrite a saved .blend file. The camera is designed for the included 9 × 8 m sample; adapt it for other plans. CPU rendering may take several minutes.

Blender was unavailable in the build environment, so the script was syntax-checked but its render was not executed. The included Higgsfield film was generated separately from the sample floor-plan reference.
