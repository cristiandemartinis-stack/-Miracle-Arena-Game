#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace MiracleArena.EditorTools
{
    [InitializeOnLoad]
    public static class ProductionBootSceneAutoBuilder
    {
        private const string SceneDir = "Assets/Scenes";
        private const string ScenePath = SceneDir + "/MiracleProductionBoot.unity";

        static ProductionBootSceneAutoBuilder()
        {
            EditorApplication.delayCall += EnsureBootScene;
        }

        public static void EnsureBootScene()
        {
            if (Application.isPlaying) return;

            if (!File.Exists(ScenePath))
            {
                Directory.CreateDirectory(SceneDir);

                Scene previous = SceneManager.GetActiveScene();
                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive);
                SceneManager.SetActiveScene(scene);

                CreateCamera();
                CreateLighting();

                EditorSceneManager.SaveScene(scene, ScenePath);
                EditorSceneManager.CloseScene(scene, true);

                if (previous.IsValid() && previous.isLoaded)
                    SceneManager.SetActiveScene(previous);

                AssetDatabase.Refresh();
                Debug.Log("MIRACLE: generated production boot scene for CI/device builds. Runtime art remains production-only.");
            }

            bool configured = false;
            foreach (var s in EditorBuildSettings.scenes)
            {
                if (s.enabled && s.path == ScenePath)
                {
                    configured = true;
                    break;
                }
            }

            if (!configured)
            {
                EditorBuildSettings.scenes = new[]
                {
                    new EditorBuildSettingsScene(ScenePath, true)
                };
                AssetDatabase.SaveAssets();
                Debug.Log("MIRACLE: production boot scene added to EditorBuildSettings.");
            }
        }

        private static void CreateCamera()
        {
            var go = new GameObject("Production Camera");
            go.tag = "MainCamera";
            var camera = go.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.fieldOfView = 50f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 250f;
            go.transform.position = new Vector3(0f, 2.1f, -4.8f);
            go.transform.rotation = Quaternion.Euler(12f, 0f, 0f);
        }

        private static void CreateLighting()
        {
            var go = new GameObject("Production Key Light");
            var light = go.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.shadows = LightShadows.Soft;
            go.transform.rotation = Quaternion.Euler(48f, -28f, 0f);
        }
    }
}
#endif
