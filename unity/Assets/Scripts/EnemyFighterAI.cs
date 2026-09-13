using UnityEngine;

namespace MiracleArena
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class EnemyFighterAI : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 2.9f;
        [SerializeField] private float rotationSpeed = 10f;
        [SerializeField] private float preferredRange = 1.65f;
        [SerializeField] private float attackCooldown = 1.05f;
        [SerializeField] private float damage = 11f;
        [SerializeField] private float hitRadius = 0.65f;
        [SerializeField] private Animator animator;

        private CharacterController controller;
        private Transform target;
        private Health health;
        private float nextAttack;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            health = GetComponent<Health>();
        }

        private void Start()
        {
            MobileFighterController player = FindFirstObjectByType<MobileFighterController>();
            if (player != null) target = player.transform;
        }

        private void Update()
        {
            if (target == null || health != null && health.IsDead) return;

            Vector3 delta = target.position - transform.position;
            delta.y = 0f;
            float distance = delta.magnitude;
            if (distance > 0.05f)
            {
                Quaternion desired = Quaternion.LookRotation(delta.normalized, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, desired, rotationSpeed * Time.deltaTime);
            }

            float speed01 = 0f;
            if (distance > preferredRange)
            {
                Vector3 move = delta.normalized * moveSpeed;
                controller.Move((move + Physics.gravity * 0.04f) * Time.deltaTime);
                speed01 = 1f;
            }
            else if (Time.time >= nextAttack)
            {
                nextAttack = Time.time + attackCooldown;
                animator?.SetTrigger("Attack1");
                Invoke(nameof(DealDamage), 0.18f);
            }

            animator?.SetFloat("Speed", speed01, 0.08f, Time.deltaTime);
        }

        private void DealDamage()
        {
            if (target == null) return;
            Vector3 center = transform.position + Vector3.up + transform.forward * 0.85f;
            foreach (Collider hit in Physics.OverlapSphere(center, hitRadius, ~0, QueryTriggerInteraction.Ignore))
            {
                if (hit.transform.root == transform.root) continue;
                Health victim = hit.GetComponentInParent<Health>();
                if (victim != null && victim.transform.root == target.root)
                {
                    victim.TakeDamage(damage);
                    break;
                }
            }
        }
    }
}
