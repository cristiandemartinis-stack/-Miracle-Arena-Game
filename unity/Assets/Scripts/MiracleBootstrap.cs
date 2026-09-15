using UnityEngine;

namespace MiracleArena
{
    public sealed class MiracleBootstrap : MonoBehaviour
    {
        [SerializeField] private Transform playerSpawn;
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private bool createRuntimeVerticalSlice = false;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBoot()
        {
            if (FindFirstObjectByType<MiracleBootstrap>() != null) return;
            GameObject root = new GameObject("MIRACLE Bootstrap");
            root.AddComponent<MiracleBootstrap>();
        }

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
        }

        private void Start()
        {
            if (FindFirstObjectByType<MobileFighterController>() != null) return;

            if (playerPrefab != null && playerSpawn != null)
            {
                GameObject player = Instantiate(playerPrefab, playerSpawn.position, playerSpawn.rotation);
                if (!ProductionVisualValidator.IsProductionReady(player, out string reason))
                {
                    Debug.LogError($"MIRACLE production gate blocked player prefab: {reason}");
                    Destroy(player);
                    return;
                }
                BuildProductionWorld(player);
                return;
            }

            ProductionCharacterLoader loader = GetComponent<ProductionCharacterLoader>();
            if (loader == null) loader = gameObject.AddComponent<ProductionCharacterLoader>();
            if (loader.TryLoad(out GameObject productionPlayer, out _, out string loadReason))
            {
                BuildProductionWorld(productionPlayer);
                return;
            }

            Debug.LogWarning("MIRACLE production boot stopped: " + loadReason);
            if (createRuntimeVerticalSlice)
                Debug.LogWarning("Legacy primitive vertical slice remains disabled for production quality.");
        }

        private void BuildProductionWorld(GameObject player)
        {
            RuntimeVerticalSliceBuilder world = GetComponent<RuntimeVerticalSliceBuilder>();
            if (world == null) world = gameObject.AddComponent<RuntimeVerticalSliceBuilder>();
            world.BuildWorld(player);
            Debug.Log("MIRACLE: production fighters connected to playable mobile vertical-slice world.");
        }
    }
}
