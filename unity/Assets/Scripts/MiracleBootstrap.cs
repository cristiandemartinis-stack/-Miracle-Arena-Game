using UnityEngine;

namespace MiracleArena
{
    public sealed class MiracleBootstrap : MonoBehaviour
    {
        [SerializeField] private Transform playerSpawn;
        [SerializeField] private GameObject playerPrefab;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
        }

        private void Start()
        {
            if (playerPrefab != null && playerSpawn != null && FindFirstObjectByType<MobileFighterController>() == null)
            {
                Instantiate(playerPrefab, playerSpawn.position, playerSpawn.rotation);
            }
        }
    }
}
