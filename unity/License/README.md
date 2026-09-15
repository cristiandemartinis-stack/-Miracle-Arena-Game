# Unity License / Activation

This folder is intentionally tracked so the license setup instructions remain visible in the repository.

## Important

Do **not** place the real Unity license file, serial number, Unity account email, password, access token, or any other credential in this folder.

The GitHub Actions workflow reads Unity activation data from protected GitHub Secrets:

- `UNITY_LICENSE`
- `UNITY_SERIAL`
- `UNITY_EMAIL`
- `UNITY_PASSWORD`

The actual secret values remain outside the repository and must never be committed.

If the Unity activation method changes, update this README and `.github/workflows/unity-build.yml` while continuing to keep all secret values in GitHub Secrets.

The presence of this README guarantees that `unity/License/` remains a real, persistent Git-tracked folder instead of disappearing when empty.
