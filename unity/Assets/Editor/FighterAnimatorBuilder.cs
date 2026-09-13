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
            AnimationClip attack1 = Pick(clips, "melee", "hook") ?? Pick(clips, "punch") ?? Pick(clips, "attack");
            AnimationClip attack2 = Pick(clips, "sword", "regular", "a") ?? PickNext(clips, attack1, "melee", "sword", "attack");
            AnimationClip attack3 = Pick(clips, "combo") ?? PickNext(clips, attack2, "melee", "sword", "attack");
            AnimationClip dodge = Pick(clips, "slide", "start") ?? Pick(clips, "dash") ?? Pick(clips, "dodge");
            AnimationClip hit = Pick(clips, "hit", "knockback") ?? Pick(clips, "hit") ?? Pick(clips, "damage");
            AnimationClip ko = Pick(clips, "death") ?? Pick(clips, "die") ?? Pick(clips, "fall") ?? Pick(clips, "lay");

            var missing = new List<string>();
            if (idle == null) missing.Add("Idle");
            if (move == null) missing.Add("Move");
            if (attack1 == null) missing.Add("Attack1");
            if (attack2 == null) missing.Add("Attack2");
            if (attack3 == null) missing.Add("Attack3");
            if (dodge == null) missing.Add("Dodge");
            if (hit == null) missing.Add("Hit");
            if (ko == null) missing.Add("KO");
            if (missing.Count > 0)
            {
                Debug.LogError("MIRACLE: animator build blocked; missing clips: " + string.Join(", ", missing));
                DumpCandidateNames(clips);
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

            AddTriggerState(sm, controller, idleState, "Attack1", attack1);
            AddTriggerState(sm, controller, idleState, "Attack2", attack2);
            AddTriggerState(sm, controller, idleState, "Attack3", attack3);
            AddTriggerState(sm, controller, idleState, "Dodge", dodge);
            AddTriggerState(sm, controller, idleState, "Hit", hit);
            AddTriggerState(sm, controller, idleState, "KO", ko, returnToIdle:false);

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
            return clips.FirstOrDefault(c => terms.All(t => c.name.IndexOf(t, StringComparison.OrdinalIgnoreCase) >= 0));
        }

        private static AnimationClip PickNext(List<AnimationClip> clips, AnimationClip exclude, params string[] anyTerms)
        {
            return clips.FirstOrDefault(c => c != exclude && anyTerms.Any(t => c.name.IndexOf(t, StringComparison.OrdinalIgnoreCase) >= 0));
        }

        private static void AddFloatTransition(AnimatorState from, AnimatorState to, string parameter, float threshold, bool greater)
        {
            var t = from.AddTransition(to);
            t.hasExitTime = false;
            t.duration = 0.08f;
            t.AddCondition(greater ? AnimatorConditionMode.Greater : AnimatorConditionMode.Less, threshold, parameter);
        }

        private static void AddTriggerState(AnimatorStateMachine sm, AnimatorController controller, AnimatorState fallback, string trigger, AnimationClip clip, bool returnToIdle = true)
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
