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
        private const string CameraName = "Production Camera";
        private const string LightName = "Production Key Light";

        static ProductionBootSceneAutoBuilder()
        {
            EditorApplication.delayCall += EnsureBootScene;
        }

        public static void EnsureBootScene()
        {
            if (Application.isPlaying) return;

            Directory.CreateDirectory(SceneDir);

            Scene previous = SceneManager.GetActiveScene();
            Scene scene;
            bool openedForValidation = false;

            if (File.Exists(ScenePath))
            {
                scene = SceneManager.GetSceneByPath(ScenePath);
                if (!scene.IsValid() || !scene.isLoaded)
                {
                    scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Additive);
                    openedForValidation = true;
                }
            }
            else
            {
                scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Additive);
                openedForValidation = true;
            }

            SceneManager.SetActiveScene(scene);

            bool changed = EnsureCamera(scene);
            changed |= EnsureLighting(scene);

            if (!File.Exists(ScenePath) || changed)
            {
                EditorSceneManager.SaveScene(scene, ScenePath);
                Debug.Log("MIRACLE: production boot scene verified with a renderable camera and production key light.");
            }

            if (openedForValidation && scene.IsValid() && scene.isLoaded)
                EditorSceneManager.CloseScene(scene, true);

            if (previous.IsValid() && previous.isLoaded)
                SceneManager.SetActiveScene(previous);

            AssetDatabase.Refresh();

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

        private static bool EnsureCamera(Scene scene)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                Camera existing = root.GetComponentInChildren<Camera>(true);
                if (existing == null) continue;

                if (!existing.CompareTag("MainCamera")) existing.tag = "MainCamera";
                return false;
            }

            var go = new GameObject(CameraName);
            SceneManager.MoveGameObjectToScene(go, scene);
            go.tag = "MainCamera";
            var camera = go.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.fieldOfView = 50f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 250f;
            go.transform.position = new Vector3(0f, 2.1f, -4.8f);
            go.transform.rotation = Quaternion.Euler(12f, 0f, 0f);
            return true;
        }

        private static bool EnsureLighting(Scene scene)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                Light[] lights = root.GetComponentsInChildren<Light>(true);
                foreach (Light existing in lights)
                    if (existing.type == LightType.Directional) return false;
            }

            var go = new GameObject(LightName);
            SceneManager.MoveGameObjectToScene(go, scene);
            var light = go.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.shadows = LightShadows.Soft;
            go.transform.rotation = Quaternion.Euler(48f, -28f, 0f);
            return true;
        }
    }
}
#endif
