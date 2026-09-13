#if UNITY_EDITOR
using System;
using System.IO;
using System.Net;
using UnityEditor;
using UnityEngine;

namespace MiracleArena.Editor
{
    public static class VitruvianAssetBootstrap
    {
        private const string TargetDir = "Assets/ProductionCharacters/Vitruvian";
        private const string RawBase = "https://raw.githubusercontent.com/ibrews/VitruvianGodot/main/";

        private static readonly (string remote, string local)[] Files =
        {
            ("godot_project/vitruvian_body.glb", "vitruvian_body.glb"),
            ("godot_project/vitruvian_head.glb", "vitruvian_head.glb"),
            ("godot_project/vitruvian_hair_rigged.glb", "vitruvian_hair_rigged.glb"),
            ("LICENSE", "LICENSE.txt"),
            ("NOTICE.md", "NOTICE.md")
        };

        [MenuItem("MIRACLE/Production/Fetch CC0 Vitruvian Character")]
        public static void DownloadAll()
        {
            Directory.CreateDirectory(TargetDir);
            using var client = new WebClient();
            client.Headers.Add("User-Agent", "MIRACLE-Arena-Asset-Bootstrap");

            foreach (var file in Files)
            {
                var destination = Path.Combine(TargetDir, file.local);
                Debug.Log($"MIRACLE: downloading {file.remote}");
                client.DownloadFile(new Uri(RawBase + file.remote), destination);
                if (!File.Exists(destination) || new FileInfo(destination).Length < 1024)
                    throw new InvalidDataException($"Downloaded asset looks invalid: {destination}");
            }

            File.WriteAllText(Path.Combine(TargetDir, "SOURCE.txt"),
                "Source: https://github.com/ibrews/VitruvianGodot\n" +
                "Character/morphs/textures: CC0 per upstream README/NOTICE.\n" +
                "Upstream code: MIT. Verify NOTICE before distribution.\n");

            AssetDatabase.Refresh();
            Debug.Log("MIRACLE: CC0 Vitruvian character assets downloaded. Use glTFast Editor Import to create Unity prefabs, then run the Production Visual Gate.");
        }
    }
}
#endif
