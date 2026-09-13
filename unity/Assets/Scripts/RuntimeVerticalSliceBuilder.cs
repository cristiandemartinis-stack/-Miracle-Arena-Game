using UnityEngine;

namespace MiracleArena
{
    public sealed class RuntimeVerticalSliceBuilder : MonoBehaviour
    {
        [SerializeField] private bool buildOnStart = true;
        [SerializeField] private int enemyCount = 3;

        private Material asphalt, concrete, brick, dark, metal, playerMat, enemyMat;

        private void Start()
        {
            if (buildOnStart && FindFirstObjectByType<MobileFighterController>() == null) Build();
        }

        public void Build()
        {
            CreateMaterials();
            BuildLighting();
            BuildUrbanBlock();
            GameObject player = BuildPlayer();
            BuildCamera(player.transform);
            for (int i = 0; i < enemyCount; i++) BuildEnemy(new Vector3(-2.5f + i * 2.5f, 0f, 4.5f + Mathf.Abs(i - 1) * 1.4f));
        }

        private void CreateMaterials()
        {
            asphalt = Mat(new Color(0.12f,0.14f,0.16f), .92f);
            concrete = Mat(new Color(0.42f,0.40f,0.37f), .85f);
            brick = Mat(new Color(0.34f,0.16f,0.13f), .78f);
            dark = Mat(new Color(0.06f,0.075f,0.09f), .68f);
            metal = Mat(new Color(0.22f,0.25f,0.28f), .35f, .65f);
            playerMat = Mat(new Color(0.78f,0.24f,0.14f), .42f, .12f);
            enemyMat = Mat(new Color(0.16f,0.28f,0.38f), .46f, .10f);
        }

        private Material Mat(Color color, float smoothness, float metallic = 0f)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            Material m = new Material(shader);
            m.color = color;
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", smoothness);
            if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", metallic);
            return m;
        }

        private void BuildLighting()
        {
            RenderSettings.ambientLight = new Color(.22f,.24f,.28f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(.22f,.24f,.30f);
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogStartDistance = 18f;
            RenderSettings.fogEndDistance = 48f;

            GameObject sun = new GameObject("Sun");
            Light l = sun.AddComponent<Light>();
            l.type = LightType.Directional; l.intensity = 1.75f; l.color = new Color(1f,.72f,.52f); l.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(42f,-32f,0f);

            Point("NeonBlue", new Vector3(-7f,3.8f,-6f), new Color(.25f,.65f,1f), 8f, 14f);
            Point("WarmLamp", new Vector3(7f,4.2f,5f), new Color(1f,.48f,.22f), 7f, 13f);
        }

        private void Point(string name, Vector3 p, Color c, float intensity, float range)
        {
            GameObject g = new GameObject(name); g.transform.position = p;
            Light l = g.AddComponent<Light>(); l.type = LightType.Point; l.color = c; l.intensity = intensity; l.range = range; l.shadows = LightShadows.Soft;
        }

        private void BuildUrbanBlock()
        {
            Box("Ground", new Vector3(0,-.3f,0), new Vector3(30,.6f,26), asphalt);
            Box("BackBuilding", new Vector3(0,4.5f,11.8f), new Vector3(30,9,1.4f), brick);
            Box("LeftBuilding", new Vector3(-14.2f,4f,0), new Vector3(1.6f,8,24), dark);
            Box("RightBuilding", new Vector3(14.2f,4f,0), new Vector3(1.6f,8,24), dark);

            for (int x=-11; x<=11; x+=4) Box("Window", new Vector3(x,5.2f,11.05f), new Vector3(2.2f,1.7f,.12f), metal);
            for (int x=-10; x<=10; x+=5) Box("Door", new Vector3(x,1.4f,11.02f), new Vector3(3f,2.8f,.15f), dark);

            for (int x=-12; x<=12; x+=3)
            {
                Box("RoadMark", new Vector3(x,.015f,-8.4f), new Vector3(1.8f,.025f,.12f), concrete);
            }

            for (int i=0;i<6;i++)
            {
                float x = -10f + i*4f;
                Box("Barrier", new Vector3(x,.5f,7.2f), new Vector3(2.4f,1f,.45f), concrete);
            }

            Car(new Vector3(-9f,.45f,-5.8f), new Color(.42f,.08f,.10f));
            Car(new Vector3(8.5f,.45f,6.2f), new Color(.08f,.22f,.38f));
            LampPost(new Vector3(-10f,0f,6.5f));
            LampPost(new Vector3(9f,0f,-6.2f));
        }

        private void Car(Vector3 p, Color c)
        {
            GameObject root = new GameObject("ParkedCar"); root.transform.position = p;
            GameObject body = Box("Body", p, new Vector3(3f,.6f,1.5f), Mat(c,.55f,.45f)); body.transform.SetParent(root.transform, true);
            GameObject cab = Box("Cab", p + Vector3.up*.55f, new Vector3(1.7f,.55f,1.3f), metal); cab.transform.SetParent(root.transform, true);
        }

        private void LampPost(Vector3 p)
        {
            GameObject post = GameObject.CreatePrimitive(PrimitiveType.Cylinder); post.name="LampPost"; post.transform.position=p+Vector3.up*2.7f; post.transform.localScale=new Vector3(.09f,2.7f,.09f); post.GetComponent<Renderer>().material=metal;
            Point("LampLight",p+Vector3.up*5.1f,new Color(1f,.72f,.45f),5f,9f);
        }

        private GameObject BuildPlayer()
        {
            GameObject g = Actor("PLAYER", Vector3.zero, playerMat);
            g.AddComponent<MobileFighterController>();
            g.AddComponent<CombatController>();
            g.AddComponent<Health>();
            g.AddComponent<MobileRuntimeInput>();
            return g;
        }

        private void BuildEnemy(Vector3 p)
        {
            GameObject g = Actor("ENEMY", p, enemyMat);
            g.AddComponent<Health>();
            g.AddComponent<EnemyFighterAI>();
        }

        private GameObject Actor(string name, Vector3 p, Material mat)
        {
            GameObject root = new GameObject(name); root.transform.position = p;
            CharacterController cc = root.AddComponent<CharacterController>(); cc.height=1.85f; cc.radius=.34f; cc.center=Vector3.up*.93f;
            GameObject torso = GameObject.CreatePrimitive(PrimitiveType.Capsule); torso.name="Visual"; torso.transform.SetParent(root.transform,false); torso.transform.localPosition=Vector3.up*.95f; torso.transform.localScale=new Vector3(.62f,.85f,.52f); torso.GetComponent<Renderer>().material=mat; Object.Destroy(torso.GetComponent<Collider>());
            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere); head.transform.SetParent(root.transform,false); head.transform.localPosition=new Vector3(0,1.82f,0); head.transform.localScale=Vector3.one*.46f; head.GetComponent<Renderer>().material=concrete; Object.Destroy(head.GetComponent<Collider>());
            return root;
        }

        private void BuildCamera(Transform target)
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject c = new GameObject("Main Camera"); c.tag="MainCamera"; cam=c.AddComponent<Camera>(); cam.fieldOfView=58f;
            }
            ThirdPersonCameraRig rig = cam.GetComponent<ThirdPersonCameraRig>();
            if (rig == null) rig = cam.gameObject.AddComponent<ThirdPersonCameraRig>();
            rig.SetTarget(target);
            cam.transform.position = target.position + new Vector3(0,3.1f,-5.4f);
        }

        private GameObject Box(string name, Vector3 p, Vector3 s, Material m)
        {
            GameObject g = GameObject.CreatePrimitive(PrimitiveType.Cube); g.name=name; g.transform.position=p; g.transform.localScale=s; g.GetComponent<Renderer>().material=m; return g;
        }
    }
}
