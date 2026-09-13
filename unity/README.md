# MIRACLE Arena — Unity Production Build

Questa cartella è la nuova pipeline di produzione per la vertical slice mobile di MIRACLE Arena.

## Target
- iPhone landscape, 60 FPS target
- URP mobile
- third-person urban combat
- visual target: stylized-realistic urban action, clearly above the old browser prototype
- Boxer / Wrestler foundation
- close combat, dodge, combo chain, cinematic follow camera

## Current code foundation
- `MiracleBootstrap.cs`: mobile runtime setup and player spawn
- `MobileFighterController.cs`: camera-relative third-person movement via CharacterController
- `CombatController.cs`: three-hit combo chain, hit sphere, damage messages, dodge movement

## Production assets still required
The browser Soldier model is intentionally not treated as final art. The Unity vertical slice must use production-quality licensed/free character, animation, environment and material assets before it can be called visually finished.

## Definition of done
A build is not approved until it is run on an iPhone-class landscape target and passes: stable launch, 3D player visible, locomotion, three attacks, dodge, enemy damage, camera follow, environment rendering, and a visual screenshot review against the agreed urban-action target.
