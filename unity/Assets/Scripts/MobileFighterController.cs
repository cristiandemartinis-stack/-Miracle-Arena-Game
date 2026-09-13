using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace MiracleArena
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class MobileFighterController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 4.6f;
        [SerializeField] private float rotationSpeed = 14f;
        [SerializeField] private Animator animator;
        [SerializeField] private Transform cameraTransform;

        private CharacterController controller;
        private Vector2 moveInput;
        private Vector3 velocity;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            ResolveCamera();
        }

        public void SetMoveInput(Vector2 value) => moveInput = Vector2.ClampMagnitude(value, 1f);
        public void SetCamera(Transform value) => cameraTransform = value;

        private void ResolveCamera()
        {
            if (cameraTransform == null && Camera.main != null) cameraTransform = Camera.main.transform;
        }

        private void Update()
        {
            if (cameraTransform == null) ResolveCamera();

#if ENABLE_INPUT_SYSTEM
            if (Keyboard.current != null)
            {
                Vector2 keyboard = Vector2.zero;
                if (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed) keyboard.x -= 1f;
                if (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed) keyboard.x += 1f;
                if (Keyboard.current.sKey.isPressed || Keyboard.current.downArrowKey.isPressed) keyboard.y -= 1f;
                if (Keyboard.current.wKey.isPressed || Keyboard.current.upArrowKey.isPressed) keyboard.y += 1f;
                if (keyboard.sqrMagnitude > 0f) moveInput = Vector2.ClampMagnitude(keyboard, 1f);
            }
#endif

            Vector3 forward = cameraTransform != null ? Vector3.Scale(cameraTransform.forward, new Vector3(1f, 0f, 1f)).normalized : Vector3.forward;
            Vector3 right = cameraTransform != null ? Vector3.Scale(cameraTransform.right, new Vector3(1f, 0f, 1f)).normalized : Vector3.right;
            Vector3 move = forward * moveInput.y + right * moveInput.x;
            if (move.sqrMagnitude > 1f) move.Normalize();

            if (move.sqrMagnitude > 0.001f)
            {
                Quaternion target = Quaternion.LookRotation(move, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, target, rotationSpeed * Time.deltaTime);
            }

            if (controller.isGrounded && velocity.y < 0f) velocity.y = -1f;
            velocity.y += Physics.gravity.y * Time.deltaTime;
            controller.Move((move * moveSpeed + velocity) * Time.deltaTime);

            if (animator != null) animator.SetFloat("Speed", move.magnitude, 0.08f, Time.deltaTime);
        }
    }
}
