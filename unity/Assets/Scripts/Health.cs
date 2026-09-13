using System;
using UnityEngine;

namespace MiracleArena
{
    public sealed class Health : MonoBehaviour
    {
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private Animator animator;
        [SerializeField] private bool destroyOnDeath;
        [SerializeField] private float destroyDelay = 1.8f;

        public float Current { get; private set; }
        public float Max => maxHealth;
        public bool IsDead { get; private set; }
        public event Action<Health> Died;
        public event Action<float, float> Changed;

        private void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>(true);
            Current = maxHealth;
        }

        public void SetAnimator(Animator value) => animator = value;

        public void TakeDamage(float amount)
        {
            if (IsDead || amount <= 0f) return;
            Current = Mathf.Max(0f, Current - amount);
            Changed?.Invoke(Current, maxHealth);
            animator?.SetTrigger("Hit");
            if (Current <= 0f) Die();
        }

        public void Heal(float amount)
        {
            if (IsDead || amount <= 0f) return;
            Current = Mathf.Min(maxHealth, Current + amount);
            Changed?.Invoke(Current, maxHealth);
        }

        private void Die()
        {
            IsDead = true;
            animator?.SetTrigger("KO");
            foreach (Collider c in GetComponentsInChildren<Collider>()) c.enabled = false;
            Died?.Invoke(this);
            if (destroyOnDeath) Destroy(gameObject, destroyDelay);
        }
    }
}
