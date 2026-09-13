#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    public static class ProductionCharacterAssembler
    {
        private const string Root = "Assets/ProductionCharacters/Vitruvian";
        private const string BodyPath = Root + "/vitruvian_body.glb";
        private const string HeadPath = Root + "/vitruvian_head.glb";
        private const string HairPath = Root + "/vitruvian_hair_rigged.glb";
        private const string PrefabDir = "Assets/ProductionCharacters/Prefabs";

        [MenuItem("MIRACLE/Production/Assemble Vitruvian Fighters")]
        public static void Assemble()
        {
            Directory.CreateDirectory(PrefabDir);
            AssetDatabase.Refresh();

            var body = AssetDatabase.LoadAssetAtPath<GameObject>(BodyPath);
            var head = AssetDatabase.LoadAssetAtPath<GameObject>(HeadPath);
            var hair = AssetDatabase.LoadAssetAtPath<GameObject>(HairPath);

            if (body == null || head == null || hair == null)
            {
                Debug.LogError("MIRACLE: Vitruvian GLB assets are present but not yet imported as GameObjects. Ensure glTFast is installed and let Unity finish importing before assembling.");
                return;
            }

            BuildPrefab("FighterPlayer", body, head, hair, false);
            BuildPrefab("FighterEnemy", body, head, hair, true);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("MIRACLE: production fighter prefabs assembled. Next gate: humanoid animation controller + combat animation set.");
        }

        private static void BuildPrefab(string name, GameObject bodyAsset, GameObject headAsset, GameObject hairAsset, bool enemy)
        {
            var root = new GameObject(name);
            root.tag = "Untagged";

            var body = (GameObject)PrefabUtility.InstantiatePrefab(bodyAsset);
            var head = (GameObject)PrefabUtility.InstantiatePrefab(headAsset);
            var hair = (GameObject)PrefabUtility.InstantiatePrefab(hairAsset);

            body.name = "Body";
            head.name = "Head";
            hair.name = "Hair";

            body.transform.SetParent(root.transform, false);
            head.transform.SetParent(root.transform, false);
            hair.transform.SetParent(root.transform, false);

            NormalizeLocal(body.transform);
            NormalizeLocal(head.transform);
            NormalizeLocal(hair.transform);

            var animator = root.GetComponent<Animator>();
            if (animator == null) animator = root.AddComponent<Animator>();
            animator.applyRootMotion = false;

            var controller = root.AddComponent<CharacterController>();
            controller.height = 1.82f;
            controller.radius = 0.32f;
            controller.center = new Vector3(0f, 0.91f, 0f);
            controller.stepOffset = 0.25f;

            if (enemy)
            {
                root.AddComponent<Health>();
                root.AddComponent<EnemyFighterAI>();
            }
            else
            {
                root.AddComponent<MobileFighterController>();
                root.AddComponent<CombatController>();
                root.AddComponent<Health>();
                root.AddComponent<MobileRuntimeInput>();
            }

            var stats = CollectStats(root);
            root.name = name;
            string path = PrefabDir + "/" + name + ".prefab";
            PrefabUtility.SaveAsPrefabAsset(root, path);
            Object.DestroyImmediate(root);

            Debug.Log($"MIRACLE: saved {path} | skinned renderers={stats.renderers}, vertices={stats.vertices}, materials={stats.materials}");
        }

        private static void NormalizeLocal(Transform t)
        {
            t.localPosition = Vector3.zero;
            t.localRotation = Quaternion.identity;
            t.localScale = Vector3.one;
        }

        private static (int renderers, int vertices, int materials) CollectStats(GameObject root)
        {
            int rCount = 0;
            int vertices = 0;
            int materials = 0;
            foreach (var r in root.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                rCount++;
                if (r.sharedMesh != null) vertices += r.sharedMesh.vertexCount;
                if (r.sharedMaterials != null) materials += r.sharedMaterials.Length;
            }
            return (rCount, vertices, materials);
        }
    }
}
#endif
