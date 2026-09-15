using UnityEngine;

namespace MiracleArena
{
    public sealed class RuntimeVerticalSliceBuilder : MonoBehaviour
    {
        [SerializeField] private bool buildOnStart = false;
        [SerializeField] private int enemyCount = 3;
        private Material asphalt, concrete, brick, dark, metal, playerMat, enemyMat;
        private bool worldBuilt;

        private void Start()
        {
            // Production boot calls BuildWorld explicitly after validated fighters load.
            // Legacy self-building is opt-in only so primitive actors can never silently
            // replace production characters in a shipping build.
            if (buildOnStart && FindFirstObjectByType<MobileFighterController>() == null) Build();
        }

        public void BuildWorld(GameObject productionPlayer)
        {
            if (worldBuilt || productionPlayer == null) return;
            worldBuilt = true;
            CreateMaterials();
            BuildLighting();
            BuildUrbanBlock();
            BuildCamera(productionPlayer.transform);
        }

        public void Build()
        {
            if (worldBuilt) return;
            worldBuilt = true;
            CreateMaterials(); BuildLighting(); BuildUrbanBlock();
            GameObject player = BuildPlayer(); BuildCamera(player.transform);
            for (int i = 0; i < enemyCount; i++) BuildEnemy(new Vector3(-2.5f + i * 2.5f, 0f, 4.5f + Mathf.Abs(i - 1) * 1.4f));
        }

        private void CreateMaterials()
        {
            asphalt=Mat(new Color(.12f,.14f,.16f),.92f); concrete=Mat(new Color(.42f,.40f,.37f),.85f);
            brick=Mat(new Color(.34f,.16f,.13f),.78f); dark=Mat(new Color(.06f,.075f,.09f),.68f);
            metal=Mat(new Color(.22f,.25f,.28f),.35f,.65f); playerMat=Mat(new Color(.78f,.24f,.14f),.42f,.12f);
            enemyMat=Mat(new Color(.16f,.28f,.38f),.46f,.10f);
        }
        private Material Mat(Color c,float s,float m=0f){ Shader sh=Shader.Find("Universal Render Pipeline/Lit"); if(sh==null)sh=Shader.Find("Standard"); Material x=new Material(sh); x.color=c; if(x.HasProperty("_Smoothness"))x.SetFloat("_Smoothness",s); if(x.HasProperty("_Metallic"))x.SetFloat("_Metallic",m); return x; }
        private void BuildLighting(){ RenderSettings.ambientLight=new Color(.22f,.24f,.28f); RenderSettings.fog=true; RenderSettings.fogColor=new Color(.22f,.24f,.30f); RenderSettings.fogMode=FogMode.Linear; RenderSettings.fogStartDistance=18f; RenderSettings.fogEndDistance=48f; if(GameObject.Find("Sun")==null){ GameObject sun=new GameObject("Sun"); Light l=sun.AddComponent<Light>(); l.type=LightType.Directional;l.intensity=1.75f;l.color=new Color(1f,.72f,.52f);l.shadows=LightShadows.Soft;sun.transform.rotation=Quaternion.Euler(42f,-32f,0f);} Point("NeonBlue",new Vector3(-7f,3.8f,-6f),new Color(.25f,.65f,1f),8f,14f); Point("WarmLamp",new Vector3(7f,4.2f,5f),new Color(1f,.48f,.22f),7f,13f); }
        private void Point(string n,Vector3 p,Color c,float i,float r){ if(GameObject.Find(n)!=null)return; GameObject g=new GameObject(n);g.transform.position=p;Light l=g.AddComponent<Light>();l.type=LightType.Point;l.color=c;l.intensity=i;l.range=r;l.shadows=LightShadows.Soft; }
        private void BuildUrbanBlock(){ Box("Ground",new Vector3(0,-.3f,0),new Vector3(30,.6f,26),asphalt);Box("BackBuilding",new Vector3(0,4.5f,11.8f),new Vector3(30,9,1.4f),brick);Box("LeftBuilding",new Vector3(-14.2f,4f,0),new Vector3(1.6f,8,24),dark);Box("RightBuilding",new Vector3(14.2f,4f,0),new Vector3(1.6f,8,24),dark);for(int x=-11;x<=11;x+=4)Box("Window",new Vector3(x,5.2f,11.05f),new Vector3(2.2f,1.7f,.12f),metal);for(int x=-10;x<=10;x+=5)Box("Door",new Vector3(x,1.4f,11.02f),new Vector3(3f,2.8f,.15f),dark);for(int x=-12;x<=12;x+=3)Box("RoadMark",new Vector3(x,.015f,-8.4f),new Vector3(1.8f,.025f,.12f),concrete);for(int i=0;i<6;i++){float x=-10f+i*4f;Box("Barrier",new Vector3(x,.5f,7.2f),new Vector3(2.4f,1f,.45f),concrete);}Car(new Vector3(-9f,.45f,-5.8f),new Color(.42f,.08f,.10f));Car(new Vector3(8.5f,.45f,6.2f),new Color(.08f,.22f,.38f));LampPost(new Vector3(-10f,0f,6.5f));LampPost(new Vector3(9f,0f,-6.2f)); }
        private void Car(Vector3 p,Color c){GameObject r=new GameObject("ParkedCar");r.transform.position=p;GameObject b=Box("Body",p,new Vector3(3f,.6f,1.5f),Mat(c,.55f,.45f));b.transform.SetParent(r.transform,true);GameObject cab=Box("Cab",p+Vector3.up*.55f,new Vector3(1.7f,.55f,1.3f),metal);cab.transform.SetParent(r.transform,true);}
        private void LampPost(Vector3 p){GameObject post=GameObject.CreatePrimitive(PrimitiveType.Cylinder);post.name="LampPost";post.transform.position=p+Vector3.up*2.7f;post.transform.localScale=new Vector3(.09f,2.7f,.09f);post.GetComponent<Renderer>().material=metal;Point("LampLight_"+p.x,p+Vector3.up*5.1f,new Color(1f,.72f,.45f),5f,9f);}
        private GameObject BuildPlayer(){GameObject g=Actor("PLAYER",Vector3.zero,playerMat);g.AddComponent<MobileFighterController>();g.AddComponent<CombatController>();g.AddComponent<Health>();g.AddComponent<MobileRuntimeInput>();return g;}
        private void BuildEnemy(Vector3 p){GameObject g=Actor("ENEMY",p,enemyMat);g.AddComponent<Health>();g.AddComponent<EnemyFighterAI>();}
        private GameObject Actor(string n,Vector3 p,Material mat){GameObject r=new GameObject(n);r.transform.position=p;CharacterController cc=r.AddComponent<CharacterController>();cc.height=1.85f;cc.radius=.34f;cc.center=Vector3.up*.93f;GameObject t=GameObject.CreatePrimitive(PrimitiveType.Capsule);t.name="Visual";t.transform.SetParent(r.transform,false);t.transform.localPosition=Vector3.up*.95f;t.transform.localScale=new Vector3(.62f,.85f,.52f);t.GetComponent<Renderer>().material=mat;Destroy(t.GetComponent<Collider>());GameObject h=GameObject.CreatePrimitive(PrimitiveType.Sphere);h.transform.SetParent(r.transform,false);h.transform.localPosition=new Vector3(0,1.82f,0);h.transform.localScale=Vector3.one*.46f;h.GetComponent<Renderer>().material=concrete;Destroy(h.GetComponent<Collider>());return r;}
        private void BuildCamera(Transform target){Camera cam=Camera.main;if(cam==null){GameObject c=new GameObject("Main Camera");c.tag="MainCamera";cam=c.AddComponent<Camera>();cam.fieldOfView=58f;}ThirdPersonCameraRig rig=cam.GetComponent<ThirdPersonCameraRig>();if(rig==null)rig=cam.gameObject.AddComponent<ThirdPersonCameraRig>();rig.SetTarget(target);cam.transform.position=target.position+new Vector3(0,3.1f,-5.4f);}
        private GameObject Box(string n,Vector3 p,Vector3 s,Material m){GameObject g=GameObject.CreatePrimitive(PrimitiveType.Cube);g.name=n;g.transform.position=p;g.transform.localScale=s;g.GetComponent<Renderer>().material=m;return g;}
    }
}
