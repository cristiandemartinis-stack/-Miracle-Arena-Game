#if UNITY_EDITOR
using UnityEditor;

namespace MiracleArena.EditorTools
{
    public sealed class QuaterniusHumanoidImporter : AssetPostprocessor
    {
        private void OnPreprocessModel()
        {
            if (!assetPath.Contains("Assets/ThirdParty/Quaternius/UniversalAnimationLibrary1/UAL1_Standard.fbx")) return;

            if (assetImporter is ModelImporter importer)
            {
                importer.animationType = ModelImporterAnimationType.Human;
                importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                importer.importAnimation = true;
                importer.importBlendShapes = false;
                importer.optimizeGameObjects = false;
            }
        }
    }
}
#endif
