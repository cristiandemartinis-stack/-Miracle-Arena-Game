using UnityEngine;

namespace MiracleArena
{
    public sealed class MiracleBootstrap : MonoBehaviour
    {
        [SerializeField] private Transform playerSpawn;
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private bool createRuntimeVerticalSlice = true;

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
                Instantiate(playerPrefab, playerSpawn.position, playerSpawn.rotation);
                return;
            }

            if (createRuntimeVerticalSlice && FindFirstObjectByType<RuntimeVerticalSliceBuilder>() == null)
            {
                GameObject builder = new GameObject("MIRACLE Runtime Vertical Slice");
                builder.AddComponent<RuntimeVerticalSliceBuilder>();
            }
        }
    }
}
