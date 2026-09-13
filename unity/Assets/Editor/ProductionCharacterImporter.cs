#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    public sealed class ProductionCharacterImporter : AssetPostprocessor
    {
        private void OnPreprocessModel()
        {
            if (!assetPath.Contains("/ProductionCharacters/")) return;

            ModelImporter importer = (ModelImporter)assetImporter;
            importer.animationType = ModelImporterAnimationType.Human;
            importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
            importer.importAnimation = true;
            importer.importBlendShapes = true;
            importer.importCameras = false;
            importer.importLights = false;
            importer.meshCompression = ModelImporterMeshCompression.Off;
            importer.optimizeMeshPolygons = true;
            importer.optimizeMeshVertices = true;
            importer.isReadable = false;
        }

        private void OnPostprocessModel(GameObject root)
        {
            if (!assetPath.Contains("/ProductionCharacters/")) return;

            SkinnedMeshRenderer[] renderers = root.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            int vertices = 0;
            foreach (SkinnedMeshRenderer renderer in renderers)
            {
                if (renderer.sharedMesh != null) vertices += renderer.sharedMesh.vertexCount;
                renderer.updateWhenOffscreen = false;
                renderer.skinnedMotionVectors = false;
            }

            if (vertices < 12000)
            {
                Debug.LogWarning($"MIRACLE production import warning: {assetPath} has only {vertices} skinned vertices; current production gate requires 12,000+.");
            }
        }
    }
}
#endif
