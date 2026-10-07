# Selected browser builds

Only one edition of each game is exposed on the project page. All game files load on demand in the dedicated player. Desktop keyboard controls are recommended. Game language is labeled on each card.

| Game | Selected source edition |
| --- | --- |
| Whitebird | Whitebird-RSI-Three-Stages-20261007-EN-Windows-x64 / 03-Latest-R2c-EN, v0.8.2-r2c-en |
| Racing Rocket Trials | ver3 / playable-web.zip, single-thread Godot web export |
| See You Tomorrow | Three-Stage-2D-Games / 03-refined |
| Bluebay Night Kitchen | Three-stage comparison / 02-V6.1 / Game (browser build) |

The original downloads remain outside the published files. Executable launchers and bundled desktop runtimes are omitted. Relative game assets and vendor licenses are retained.

Static-hosting adaptations:
- Whitebird uses its existing local run-history persistence/export instead of its optional server upload endpoint.
- Bluebay keeps its latest session and up to 100 feedback records in browser local storage, with no feedback server. Gameplay progress retains the existing save mechanism. Storage failures are reported through the original export fallback.
- Bluebay's optional static-mesh batching groups compatible vertex-attribute layouts before merging; gameplay rules and assets are unchanged.
- See You Tomorrow's standalone HTML is named `index.html`; its inline script and CSP are unchanged.

Progress and feedback stay in the visitor's browser. No central player-feedback collection is provided by these static builds.
