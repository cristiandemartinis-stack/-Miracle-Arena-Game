import bpy
import math
import os
import json
from mathutils import Vector

ROOT = os.environ.get("GITHUB_WORKSPACE", os.getcwd())
ASSET_DIR = os.path.join(ROOT, "unity", "Assets", "ProductionCharacters", "Vitruvian")
OUT_DIR = os.path.join(ROOT, "visual-validation")
os.makedirs(OUT_DIR, exist_ok=True)

assets = [
    os.path.join(ASSET_DIR, "vitruvian_body.glb"),
    os.path.join(ASSET_DIR, "vitruvian_head.glb"),
    os.path.join(ASSET_DIR, "vitruvian_hair_rigged.glb"),
]

for path in assets:
    if not os.path.isfile(path) or os.path.getsize(path) == 0:
        raise RuntimeError(f"Missing production asset: {path}")

bpy.ops.wm.read_factory_settings(use_empty=True)

for path in assets:
    bpy.ops.import_scene.gltf(filepath=path)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
armatures = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
if not meshes:
    raise RuntimeError("No mesh imported from Vitruvian assets")

# Compute world-space bounds.
coords = []
for obj in meshes:
    for corner in obj.bound_box:
        coords.append(obj.matrix_world @ Vector(corner))
mins = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
maxs = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
center = (mins + maxs) * 0.5
size = maxs - mins
height = max(size.z, 0.001)

# Ground plane slightly below the character.
bpy.ops.mesh.primitive_plane_add(size=max(size.x, size.y, height) * 4.0, location=(center.x, center.y, mins.z - 0.01))
plane = bpy.context.active_object
plane.name = "ValidationGround"
mat = bpy.data.materials.new("ValidationGroundMat")
mat.diffuse_color = (0.055, 0.06, 0.07, 1.0)
plane.data.materials.append(mat)

# Camera.
bpy.ops.object.camera_add()
cam = bpy.context.active_object
cam.data.lens = 68
cam.data.sensor_width = 36

def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# Front three-quarter view; GLB character commonly faces -Y/+Y depending export,
# so angle from +Y with some X offset gives an informative silhouette either way.
cam.location = (center.x + height * 0.62, center.y + height * 2.15, center.z + height * 0.08)
look_at(cam, center + Vector((0, 0, height * 0.02)))
bpy.context.scene.camera = cam

# Key light.
bpy.ops.object.light_add(type='AREA', location=(center.x + height * 1.2, center.y + height * 1.3, center.z + height * 1.15))
key = bpy.context.active_object
key.data.energy = 1300
key.data.shape = 'DISK'
key.data.size = height * 1.25
look_at(key, center)

# Fill.
bpy.ops.object.light_add(type='AREA', location=(center.x - height * 1.2, center.y + height * 0.7, center.z + height * 0.65))
fill = bpy.context.active_object
fill.data.energy = 650
fill.data.size = height * 1.0
look_at(fill, center)

# Rim.
bpy.ops.object.light_add(type='AREA', location=(center.x, center.y - height * 1.0, center.z + height * 1.2))
rim = bpy.context.active_object
rim.data.energy = 900
rim.data.size = height * 0.8
look_at(rim, center)

scene = bpy.context.scene
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except Exception:
        pass

scene.render.resolution_x = 900
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.world.color = (0.018, 0.022, 0.03)
scene.render.filepath = os.path.join(OUT_DIR, "vitruvian-production-preview.png")

# Color management for a neutral PBR preview.
try:
    scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass

bpy.ops.render.render(write_still=True)

report = {
    "mesh_count": len(meshes),
    "armature_count": len(armatures),
    "material_slots": sum(len(o.material_slots) for o in meshes),
    "vertex_count": sum(len(o.data.vertices) for o in meshes),
    "bounds": {"min": list(mins), "max": list(maxs), "size": list(size)},
    "objects": [o.name for o in bpy.context.scene.objects],
}
with open(os.path.join(OUT_DIR, "vitruvian-production-report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print(json.dumps(report, indent=2))
print("Rendered:", scene.render.filepath)
