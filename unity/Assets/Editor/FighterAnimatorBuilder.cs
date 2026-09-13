#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    public static class FighterAnimatorBuilder
    {
        private const string Ual1 = "Assets/ThirdParty/Quaternius/UniversalAnimationLibrary1/UAL1_Standard.fbx";
        private const string Ual2 = "Assets/ThirdParty/Quaternius/UniversalAnimationLibrary2/UAL2_Standard.glb";
        private const string ControllerPath = "Assets/ProductionCharacters/Fighter.controller";
        private static readonly string[] Prefabs =
        {
            "Assets/ProductionCharacters/Prefabs/FighterPlayer.prefab",
            "Assets/ProductionCharacters/Prefabs/FighterEnemy.prefab"
        };

        private static readonly string[] ForbiddenCombatTerms =
        {
            "sword", "shield", "axe", "bow", "rifle", "gun", "spear", "staff", "dagger", "weapon"
        };

        [MenuItem("MIRACLE/Production/Build Fighter Animator Controller")]
        public static void Build()
        {
            var clips = LoadClips(Ual1).Concat(LoadClips(Ual2)).GroupBy(c => c.name).Select(g => g.First()).ToList();
            if (clips.Count == 0)
            {
                Debug.LogError("MIRACLE: no animation clips found in Quaternius assets.");
                return;
            }

            AnimationClip idle = Pick(clips, "idle", "loop") ?? Pick(clips, "idle");
            AnimationClip move = Pick(clips, "walk", "loop") ?? Pick(clips, "run", "loop") ?? Pick(clips, "walk");

            // Boxing/unarmed only. Never silently fall back to sword/weapon clips.
            AnimationClip attack1 = PickPreferredCombat(clips, "jab", "punch", "melee_hook", "hook");
            AnimationClip attack2 = PickDistinctCombat(clips, attack1, "cross", "straight", "overhand", "punch", "melee");
            AnimationClip attack3 = PickDistinctCombat(clips, attack2, "combo", "uppercut", "hook", "punch", "melee");

            AnimationClip dodge = PickPreferredCombat(clips, "dodge", "evade", "sidestep", "slide_start", "dash");
            AnimationClip hit = PickPreferredCombat(clips, "hit_knockback", "hit", "damage", "react");
            AnimationClip ko = PickPreferredCombat(clips, "knockout", "death", "die", "fall", "lay");

            var missing = new List<string>();
            if (idle == null) missing.Add("Idle");
            if (move == null) missing.Add("Move");
            if (attack1 == null) missing.Add("Attack1 boxer/unarmed");
            if (attack2 == null) missing.Add("Attack2 boxer/unarmed");
            if (attack3 == null) missing.Add("Attack3 boxer/unarmed");
            if (dodge == null) missing.Add("Dodge");
            if (hit == null) missing.Add("Hit");
            if (ko == null) missing.Add("KO");
            if (missing.Count > 0)
            {
                Debug.LogError("MIRACLE: animator build blocked; missing clips: " + string.Join(", ", missing));
                DumpCandidateNames(clips);
                return;
            }

            var selected = new[] { attack1, attack2, attack3, dodge, hit, ko };
            var forbidden = selected.Where(c => c != null && ForbiddenCombatTerms.Any(t => c.name.IndexOf(t, StringComparison.OrdinalIgnoreCase) >= 0)).ToList();
            if (forbidden.Count > 0)
            {
                Debug.LogError("MIRACLE: animator build blocked because weapon/non-boxing clips were selected: " + string.Join(", ", forbidden.Select(c => c.name)));
                return;
            }

            AssetDatabase.DeleteAsset(ControllerPath);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(ControllerPath);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("Attack1", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Attack2", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Attack3", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Dodge", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("Hit", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("KO", AnimatorControllerParameterType.Trigger);

            var sm = controller.layers[0].stateMachine;
            var idleState = sm.AddState("Idle"); idleState.motion = idle;
            var moveState = sm.AddState("Move"); moveState.motion = move;
            sm.defaultState = idleState;

            AddFloatTransition(idleState, moveState, "Speed", 0.15f, true);
            AddFloatTransition(moveState, idleState, "Speed", 0.10f, false);

            AddTriggerState(sm, idleState, "Attack1", attack1);
            AddTriggerState(sm, idleState, "Attack2", attack2);
            AddTriggerState(sm, idleState, "Attack3", attack3);
            AddTriggerState(sm, idleState, "Dodge", dodge);
            AddTriggerState(sm, idleState, "Hit", hit);
            AddTriggerState(sm, idleState, "KO", ko, returnToIdle:false);

            foreach (var path in Prefabs) AttachController(path, controller);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"MIRACLE: Fighter.controller built. Idle={idle.name}, Move={move.name}, Attack1={attack1.name}, Attack2={attack2.name}, Attack3={attack3.name}, Dodge={dodge.name}, Hit={hit.name}, KO={ko.name}");
        }

        private static List<AnimationClip> LoadClips(string path)
        {
            return AssetDatabase.LoadAllAssetsAtPath(path)
                .OfType<AnimationClip>()
                .Where(c => !c.name.StartsWith("__preview__", StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        private static AnimationClip Pick(IEnumerable<AnimationClip> clips, params string[] terms)
        {
            return clips.FirstOrDefault(c => terms.All(t => Normalize(c.name).Contains(Normalize(t))));
        }

        private static AnimationClip PickPreferredCombat(IEnumerable<AnimationClip> clips, params string[] preferredTerms)
        {
            foreach (var term in preferredTerms)
            {
                var clip = clips.FirstOrDefault(c => !IsForbidden(c) && Normalize(c.name).Contains(Normalize(term)));
                if (clip != null) return clip;
            }
            return null;
        }

        private static AnimationClip PickDistinctCombat(IEnumerable<AnimationClip> clips, AnimationClip exclude, params string[] preferredTerms)
        {
            foreach (var term in preferredTerms)
            {
                var clip = clips.FirstOrDefault(c => c != exclude && !IsForbidden(c) && Normalize(c.name).Contains(Normalize(term)));
                if (clip != null) return clip;
            }
            return null;
        }

        private static bool IsForbidden(AnimationClip clip)
        {
            return clip == null || ForbiddenCombatTerms.Any(t => clip.name.IndexOf(t, StringComparison.OrdinalIgnoreCase) >= 0);
        }

        private static string Normalize(string value)
        {
            return value.Replace("_", "").Replace("-", "").Replace(" ", "").ToLowerInvariant();
        }

        private static void AddFloatTransition(AnimatorState from, AnimatorState to, string parameter, float threshold, bool greater)
        {
            var t = from.AddTransition(to);
            t.hasExitTime = false;
            t.duration = 0.08f;
            t.AddCondition(greater ? AnimatorConditionMode.Greater : AnimatorConditionMode.Less, threshold, parameter);
        }

        private static void AddTriggerState(AnimatorStateMachine sm, AnimatorState fallback, string trigger, AnimationClip clip, bool returnToIdle = true)
        {
            var state = sm.AddState(trigger);
            state.motion = clip;
            var any = sm.AddAnyStateTransition(state);
            any.hasExitTime = false;
            any.duration = 0.05f;
            any.AddCondition(AnimatorConditionMode.If, 0f, trigger);
            if (returnToIdle)
            {
                var back = state.AddTransition(fallback);
                back.hasExitTime = true;
                back.exitTime = 0.92f;
                back.duration = 0.06f;
            }
        }

        private static void AttachController(string prefabPath, RuntimeAnimatorController controller)
        {
            var root = PrefabUtility.LoadPrefabContents(prefabPath);
            try
            {
                var animator = root.GetComponent<Animator>() ?? root.GetComponentInChildren<Animator>(true);
                if (animator == null) animator = root.AddComponent<Animator>();
                animator.runtimeAnimatorController = controller;
                animator.applyRootMotion = false;
                PrefabUtility.SaveAsPrefabAsset(root, prefabPath);
            }
            finally
            {
                PrefabUtility.UnloadPrefabContents(root);
            }
        }

        private static void DumpCandidateNames(IEnumerable<AnimationClip> clips)
        {
            Debug.Log("MIRACLE animation candidates:\n" + string.Join("\n", clips.Select(c => c.name).OrderBy(n => n)));
        }
    }
}
#endif
