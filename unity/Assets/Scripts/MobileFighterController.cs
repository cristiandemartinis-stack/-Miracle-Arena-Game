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
            if (cameraTransform == null && Camera.main != null) cameraTransform = Camera.main.transform;
        }

        public void SetMoveInput(Vector2 value) => moveInput = Vector2.ClampMagnitude(value, 1f);

        private void Update()
        {
            Vector3 forward = cameraTransform != null ? Vector3.Scale(cameraTransform.forward, new Vector3(1f, 0f, 1f)).normalized : Vector3.forward;
            Vector3 right = cameraTransform != null ? cameraTransform.right : Vector3.right;
            Vector3 move = (forward * moveInput.y + right * moveInput.x);
            if (move.sqrMagnitude > 1f) move.Normalize();

            if (move.sqrMagnitude > 0.001f)
            {
                Quaternion target = Quaternion.LookRotation(move, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, target, rotationSpeed * Time.deltaTime);
            }

            if (controller.isGrounded && velocity.y < 0f) velocity.y = -1f;
            velocity.y += Physics.gravity.y * Time.deltaTime;
            controller.Move((move * moveSpeed + velocity) * Time.deltaTime);

            if (animator != null)
            {
                animator.SetFloat("Speed", move.magnitude, 0.08f, Time.deltaTime);
            }
        }
    }
}
