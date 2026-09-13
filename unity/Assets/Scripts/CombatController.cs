using System.Collections;
using UnityEngine;

namespace MiracleArena
{
    public sealed class CombatController : MonoBehaviour
    {
        [SerializeField] private Animator animator;
        [SerializeField] private Transform hitOrigin;
        [SerializeField] private LayerMask hittableLayers;
        [SerializeField] private float hitRadius = 0.75f;
        [SerializeField] private float hitDistance = 1.05f;
        [SerializeField] private float damage = 18f;
        [SerializeField] private float comboWindow = 0.42f;
        [SerializeField] private float dodgeDistance = 2.2f;

        private bool busy;
        private int comboStep;
        private float lastAttackTime;

        public void Attack()
        {
            if (busy && Time.time - lastAttackTime > comboWindow) return;
            if (Time.time - lastAttackTime > comboWindow) comboStep = 0;
            comboStep = (comboStep % 3) + 1;
            lastAttackTime = Time.time;
            animator?.SetTrigger($"Attack{comboStep}");
            StartCoroutine(AttackRoutine());
        }

        private IEnumerator AttackRoutine()
        {
            busy = true;
            yield return new WaitForSeconds(0.14f);
            Vector3 origin = hitOrigin != null ? hitOrigin.position : transform.position + transform.forward * 0.8f + Vector3.up;
            Vector3 center = origin + transform.forward * hitDistance;
            foreach (Collider hit in Physics.OverlapSphere(center, hitRadius, hittableLayers, QueryTriggerInteraction.Ignore))
            {
                if (hit.transform.root == transform.root) continue;
                hit.SendMessage("TakeDamage", damage, SendMessageOptions.DontRequireReceiver);
            }
            yield return new WaitForSeconds(0.18f);
            busy = false;
        }

        public void Dodge()
        {
            if (busy) return;
            StartCoroutine(DodgeRoutine());
        }

        private IEnumerator DodgeRoutine()
        {
            busy = true;
            animator?.SetTrigger("Dodge");
            float duration = 0.22f;
            float elapsed = 0f;
            CharacterController cc = GetComponent<CharacterController>();
            while (elapsed < duration)
            {
                float step = dodgeDistance / duration * Time.deltaTime;
                if (cc != null) cc.Move(-transform.forward * step);
                else transform.position -= transform.forward * step;
                elapsed += Time.deltaTime;
                yield return null;
            }
            busy = false;
        }
    }
}
