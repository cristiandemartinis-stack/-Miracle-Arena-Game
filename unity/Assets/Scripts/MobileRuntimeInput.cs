using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace MiracleArena
{
    public sealed class MobileRuntimeInput : MonoBehaviour
    {
        [SerializeField] private MobileFighterController movement;
        [SerializeField] private CombatController combat;
        private int moveFinger = -1;
        private Vector2 moveStart;
        private Vector2 moveValue;

        private void Awake()
        {
            if (movement == null) movement = GetComponent<MobileFighterController>();
            if (combat == null) combat = GetComponent<CombatController>();
        }

        private void Update()
        {
#if ENABLE_INPUT_SYSTEM
            var screen = Touchscreen.current;
            if (screen == null) return;
            foreach (var touch in screen.touches)
            {
                if (!touch.press.isPressed) continue;
                Vector2 p = touch.position.ReadValue();
                int id = touch.touchId.ReadValue();
                if (p.x < Screen.width * 0.48f)
                {
                    if (moveFinger < 0) { moveFinger = id; moveStart = p; }
                    if (id == moveFinger)
                    {
                        moveValue = Vector2.ClampMagnitude((p - moveStart) / (Screen.height * 0.16f), 1f);
                        movement?.SetMoveInput(moveValue);
                    }
                }
            }
            bool moveStillDown = false;
            foreach (var touch in screen.touches)
                if (touch.press.isPressed && touch.touchId.ReadValue() == moveFinger) moveStillDown = true;
            if (!moveStillDown) { moveFinger = -1; moveValue = Vector2.zero; movement?.SetMoveInput(Vector2.zero); }
#endif
        }

        public void TapAttack() => combat?.Attack();
        public void TapDodge() => combat?.Dodge();

        private void OnGUI()
        {
            float s = Mathf.Min(Screen.width / 844f, Screen.height / 390f);
            GUI.skin.button.fontSize = Mathf.RoundToInt(18f * s);
            GUI.skin.label.fontSize = Mathf.RoundToInt(14f * s);
            GUI.color = new Color(1f, 1f, 1f, 0.86f);
            GUI.Box(new Rect(24*s, Screen.height-150*s, 126*s, 126*s), "MOVE");
            if (GUI.Button(new Rect(Screen.width-132*s, Screen.height-132*s, 108*s, 108*s), "COLPISCI")) TapAttack();
            if (GUI.Button(new Rect(Screen.width-232*s, Screen.height-94*s, 78*s, 78*s), "SCHIVA")) TapDodge();
            GUI.color = Color.white;
        }
    }
}
