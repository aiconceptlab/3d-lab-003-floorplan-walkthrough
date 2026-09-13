"""Optional Blender 4.2+ GLB handoff; run in a new background Blender process."""
import argparse
import sys
from pathlib import Path
import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
source = Path(args.input).resolve(strict=True)
destination = Path(args.output).resolve()
if destination.suffix.lower() != '.png':
    raise ValueError('Output must be a PNG file.')
if destination.exists():
    raise FileExistsError('Choose a new output filename; existing files are not overwritten.')
destination.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.unit_settings.system = 'METRIC'
scene.view_settings.view_transform = 'AgX'
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(destination)
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.75, .83, 1, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .2

# glTF Y-up becomes Blender Z-up: (x,y,z) -> (x,-z,y).
def point(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(.7, -4.6, 1.6))
camera = bpy.context.object
camera.data.lens = 24
point(camera, (7.1, -5.8, 1.25))
scene.camera = camera
for name, location, energy, size, colour in [
    ('Soft window daylight', (8.6, -6.7, 2.4), 550, 3, (1, .88, .72)),
    ('Cool sky fill', (3.8, -4.4, 2.65), 160, 4, (.78, .87, 1)),
]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.size, light.data.color = energy, size, colour
    point(light, (4.5, -5.5, .8))
bpy.ops.render.render(write_still=True)
