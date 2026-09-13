using UnityEngine;

namespace MiracleArena
{
    public sealed class ThirdPersonCameraRig : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new Vector3(0f, 3.15f, -5.4f);
        [SerializeField] private float positionSmooth = 9f;
        [SerializeField] private float lookHeight = 1.35f;
        [SerializeField] private float lookSmooth = 12f;

        private Vector3 lookPoint;

        public void SetTarget(Transform value)
        {
            target = value;
            if (target != null) lookPoint = target.position + Vector3.up * lookHeight;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            Vector3 desired = target.TransformPoint(offset);
            float posT = 1f - Mathf.Exp(-positionSmooth * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, desired, posT);

            Vector3 desiredLook = target.position + Vector3.up * lookHeight;
            float lookT = 1f - Mathf.Exp(-lookSmooth * Time.deltaTime);
            lookPoint = Vector3.Lerp(lookPoint, desiredLook, lookT);
            transform.rotation = Quaternion.LookRotation(lookPoint - transform.position, Vector3.up);
        }
    }
}
