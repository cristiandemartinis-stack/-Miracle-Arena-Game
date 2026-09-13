#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    public static class FighterAnimationQualityGate
    {
        private const string ControllerPath = "Assets/ProductionCharacters/Fighter.controller";
        private static readonly string[] RequiredStates = { "Idle", "Move", "Attack1", "Attack2", "Attack3", "Dodge", "Hit", "KO" };
        private static readonly string[] ForbiddenTerms = { "sword", "shield", "axe", "bow", "rifle", "gun", "spear", "staff", "dagger", "weapon" };

        [MenuItem("MIRACLE/Production/Validate Fighter Animation Quality")]
        public static bool Validate()
        {
            var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(ControllerPath);
            if (controller == null)
            {
                Debug.LogError("MIRACLE QUALITY GATE: Fighter.controller missing.");
                return false;
            }

            var sm = controller.layers[0].stateMachine;
            var states = sm.states.Select(s => s.state).ToDictionary(s => s.name, StringComparer.OrdinalIgnoreCase);
            var failures = new List<string>();

            foreach (var required in RequiredStates)
            {
                if (!states.TryGetValue(required, out var state))
                {
                    failures.Add($"Missing state {required}");
                    continue;
                }

                var clip = state.motion as AnimationClip;
                if (clip == null)
                {
                    failures.Add($"State {required} has no AnimationClip");
                    continue;
                }

                if (ForbiddenTerms.Any(t => clip.name.IndexOf(t, StringComparison.OrdinalIgnoreCase) >= 0))
                    failures.Add($"State {required} uses forbidden non-boxing clip '{clip.name}'");

                if (clip.length < 0.08f)
                    failures.Add($"State {required} clip '{clip.name}' is implausibly short ({clip.length:0.000}s)");
            }

            var attackClips = new[] { "Attack1", "Attack2", "Attack3" }
                .Where(states.ContainsKey)
                .Select(n => states[n].motion as AnimationClip)
                .Where(c => c != null)
                .ToList();

            if (attackClips.Select(c => c.name).Distinct(StringComparer.OrdinalIgnoreCase).Count() < 3)
                failures.Add("Attack1/2/3 are not three distinct animation clips.");

            if (failures.Count > 0)
            {
                Debug.LogError("MIRACLE ANIMATION QUALITY GATE FAILED:\n- " + string.Join("\n- ", failures));
                return false;
            }

            Debug.Log("MIRACLE ANIMATION QUALITY GATE PASSED: controller has distinct unarmed combat clips and no weapon fallbacks. Visual pose/retarget review is still required before demo approval.");
            return true;
        }
    }
}
#endif
