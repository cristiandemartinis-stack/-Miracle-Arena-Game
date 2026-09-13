using UnityEngine;

namespace MiracleArena
{
    public static class ProductionVisualValidator
    {
        public static bool IsProductionReady(GameObject root, out string reason)
        {
            if (root == null)
            {
                reason = "Prefab missing.";
                return false;
            }

            SkinnedMeshRenderer[] skinned = root.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            if (skinned == null || skinned.Length == 0)
            {
                reason = "No SkinnedMeshRenderer found. Primitive/static placeholder fighters are not allowed.";
                return false;
            }

            int vertices = 0;
            int materialSlots = 0;
            foreach (SkinnedMeshRenderer r in skinned)
            {
                if (r.sharedMesh != null) vertices += r.sharedMesh.vertexCount;
                materialSlots += r.sharedMaterials != null ? r.sharedMaterials.Length : 0;
            }

            if (vertices < 12000)
            {
                reason = $"Character mesh is too simple ({vertices} vertices). Minimum production gate is 12,000 vertices.";
                return false;
            }

            Animator animator = root.GetComponentInChildren<Animator>(true);
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                reason = "Animator/runtime controller missing.";
                return false;
            }

            if (materialSlots < 2)
            {
                reason = "Character does not have enough material detail for the production gate.";
                return false;
            }

            reason = "OK";
            return true;
        }
    }
}
