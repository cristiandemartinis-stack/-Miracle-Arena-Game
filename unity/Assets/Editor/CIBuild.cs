#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace MiracleArena.EditorTools
{
    public static class CIBuild
    {
        public static void BuildAndroid()
        {
            ProductionBootSceneAutoBuilder.EnsureBootScene();

            var args = Environment.GetCommandLineArgs();
            string buildPath = null;
            for (int i = 0; i < args.Length - 1; i++)
                if (args[i] == "-customBuildPath") buildPath = args[i + 1];

            if (string.IsNullOrEmpty(buildPath))
                buildPath = Path.GetFullPath(Path.Combine(Application.dataPath, "../../build/Android/MiracleArenaDemo.apk"));

            Directory.CreateDirectory(Path.GetDirectoryName(buildPath));

            var scenes = EditorBuildSettings.scenes
                .Where(s => s.enabled && !string.IsNullOrEmpty(s.path))
                .Select(s => s.path)
                .ToArray();

            if (scenes.Length == 0)
                throw new Exception("No enabled scenes available for Android build.");

            var options = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = buildPath,
                target = BuildTarget.Android,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
                throw new Exception("Android build result: " + report.summary.result);

            Debug.Log("MIRACLE CI Android build succeeded: " + buildPath);
        }
    }
}
#endif
