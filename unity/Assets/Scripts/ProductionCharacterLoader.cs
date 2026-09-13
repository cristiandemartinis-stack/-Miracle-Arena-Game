using UnityEngine;

namespace MiracleArena
{
    public sealed class ProductionCharacterLoader : MonoBehaviour
    {
        [Header("Resources paths, without extension")]
        [SerializeField] private string playerResourcePath = "Characters/FighterPlayer";
        [SerializeField] private string enemyResourcePath = "Characters/FighterEnemy";
        [SerializeField] private Vector3 playerSpawn = Vector3.zero;
        [SerializeField] private Vector3 enemySpawn = new Vector3(0f, 0f, 3.2f);

        public bool TryLoad(out GameObject player, out GameObject enemy, out string reason)
        {
            player = null;
            enemy = null;

            GameObject playerPrefab = Resources.Load<GameObject>(playerResourcePath);
            GameObject enemyPrefab = Resources.Load<GameObject>(enemyResourcePath);

            if (playerPrefab == null || enemyPrefab == null)
            {
                reason = "Production fighter prefabs are missing. Expected Resources/Characters/FighterPlayer.prefab and FighterEnemy.prefab.";
                return false;
            }

            player = Instantiate(playerPrefab, playerSpawn, Quaternion.identity);
            enemy = Instantiate(enemyPrefab, enemySpawn, Quaternion.Euler(0f, 180f, 0f));

            if (!ProductionVisualValidator.IsProductionReady(player, out string playerReason))
            {
                Destroy(player);
                Destroy(enemy);
                player = null;
                enemy = null;
                reason = "Player failed production gate: " + playerReason;
                return false;
            }

            if (!ProductionVisualValidator.IsProductionReady(enemy, out string enemyReason))
            {
                Destroy(player);
                Destroy(enemy);
                player = null;
                enemy = null;
                reason = "Enemy failed production gate: " + enemyReason;
                return false;
            }

            EnsureGameplayComponents(player, false);
            EnsureGameplayComponents(enemy, true);

            Camera cam = Camera.main;
            if (cam != null)
            {
                ThirdPersonCameraRig rig = cam.GetComponent<ThirdPersonCameraRig>();
                if (rig == null) rig = cam.gameObject.AddComponent<ThirdPersonCameraRig>();
                rig.SetTarget(player.transform);
            }

            reason = "OK";
            return true;
        }

        private static void EnsureGameplayComponents(GameObject fighter, bool enemy)
        {
            if (fighter.GetComponent<CharacterController>() == null)
            {
                CharacterController cc = fighter.AddComponent<CharacterController>();
                cc.height = 1.85f;
                cc.radius = 0.34f;
                cc.center = Vector3.up * 0.93f;
            }

            if (fighter.GetComponent<Health>() == null) fighter.AddComponent<Health>();

            if (enemy)
            {
                if (fighter.GetComponent<EnemyFighterAI>() == null) fighter.AddComponent<EnemyFighterAI>();
            }
            else
            {
                if (fighter.GetComponent<MobileFighterController>() == null) fighter.AddComponent<MobileFighterController>();
                if (fighter.GetComponent<CombatController>() == null) fighter.AddComponent<CombatController>();
                if (fighter.GetComponent<MobileRuntimeInput>() == null) fighter.AddComponent<MobileRuntimeInput>();
            }
        }
    }
}
