using System.Collections.Generic;
using UnityEngine;

namespace MiracleArena
{
    public static class FighterAnimationContract
    {
        private static readonly int Speed = Animator.StringToHash("Speed");
        private static readonly int Attack1 = Animator.StringToHash("Attack1");
        private static readonly int Attack2 = Animator.StringToHash("Attack2");
        private static readonly int Attack3 = Animator.StringToHash("Attack3");
        private static readonly int Dodge = Animator.StringToHash("Dodge");
        private static readonly int Hit = Animator.StringToHash("Hit");
        private static readonly int KO = Animator.StringToHash("KO");

        public static bool Validate(Animator animator, out string reason)
        {
            if (animator == null)
            {
                reason = "Animator missing.";
                return false;
            }
            if (animator.runtimeAnimatorController == null)
            {
                reason = "RuntimeAnimatorController missing.";
                return false;
            }

            var parameters = new Dictionary<int, AnimatorControllerParameterType>();
            foreach (var p in animator.parameters) parameters[p.nameHash] = p.type;

            if (!Has(parameters, Speed, AnimatorControllerParameterType.Float, "Speed", out reason)) return false;
            if (!Has(parameters, Attack1, AnimatorControllerParameterType.Trigger, "Attack1", out reason)) return false;
            if (!Has(parameters, Attack2, AnimatorControllerParameterType.Trigger, "Attack2", out reason)) return false;
            if (!Has(parameters, Attack3, AnimatorControllerParameterType.Trigger, "Attack3", out reason)) return false;
            if (!Has(parameters, Dodge, AnimatorControllerParameterType.Trigger, "Dodge", out reason)) return false;
            if (!Has(parameters, Hit, AnimatorControllerParameterType.Trigger, "Hit", out reason)) return false;
            if (!Has(parameters, KO, AnimatorControllerParameterType.Trigger, "KO", out reason)) return false;

            reason = "OK";
            return true;
        }

        private static bool Has(Dictionary<int, AnimatorControllerParameterType> parameters, int hash, AnimatorControllerParameterType expected, string name, out string reason)
        {
            if (!parameters.TryGetValue(hash, out var actual))
            {
                reason = $"Animator parameter '{name}' missing.";
                return false;
            }
            if (actual != expected)
            {
                reason = $"Animator parameter '{name}' has type {actual}; expected {expected}.";
                return false;
            }
            reason = "OK";
            return true;
        }
    }
}
