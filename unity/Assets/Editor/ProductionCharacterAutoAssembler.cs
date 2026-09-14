#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    [InitializeOnLoad]
    public static class ProductionCharacterAutoAssembler
    {
        private const string BodyPath = "Assets/ProductionCharacters/Vitruvian/vitruvian_body.glb";
        private const string PlayerPrefab = "Assets/Resources/Characters/FighterPlayer.prefab";
        private const string EnemyPrefab = "Assets/Resources/Characters/FighterEnemy.prefab";

        static ProductionCharacterAutoAssembler()
        {
            EditorApplication.delayCall += TryAssembleOnce;
        }

        private static void TryAssembleOnce()
        {
            if (AssetDatabase.LoadAssetAtPath<GameObject>(PlayerPrefab) != null &&
                AssetDatabase.LoadAssetAtPath<GameObject>(EnemyPrefab) != null)
                return;

            if (AssetDatabase.LoadAssetAtPath<GameObject>(BodyPath) == null)
                return;

            Debug.Log("MIRACLE: imported production character detected; assembling runtime-loadable fighter prefabs.");
            ProductionCharacterAssembler.Assemble();
        }
    }
}
#endif
