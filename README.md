# Recursive Game Creator

Research project website for **Recursive Game Creator: An Agentic Product-Level Experience-Oriented Game Harness**.

**Website:** https://rsigamecreator.github.io/

This repository contains the static project page, manuscript PDF, research figures, game screenshots, and gameplay videos. It also includes four selected browser game builds. The original downloaded game archives, agent framework, and training or evaluation runs are not published here.

## Contents

- `index.html`, `styles.css`, `app.js`: project page and interactive comparisons.
- `exploration-motion.html`: interactive exploration animation, also embedded in the main page.
- `assets/exploration-motion/`: recorded trajectory data, animation code, and source provenance.
- `play.html`, `play.css`, `play.js`: on-demand game player with controls and fullscreen support.
- `play/`: one selected browser edition each of Whitebird, Racing Rocket Trials, See You Tomorrow, and Bluebay Night Kitchen. See `play/BUILD-NOTES.md` for provenance.
- `evolution-film-preview.html`: main film, standalone game films, captions, and production notes.
- `videos/rgc-evolution-20261007/`: latest 3:40 narrated overview and three standalone films.
- `meme-arena-video.html`: earlier three-version gameplay comparison.
- `assets/`: manuscript PDF, research figures, screenshots, and provenance notes.
- `videos/meme-arena/`: comparison film, individual version captures, posters, and capture notes.

Meme Arena V1/V2 use restored development snapshots. See the page and `videos/meme-arena/README.txt` for details. The gameplay film uses matched scripted staging and is not a benchmark replay.

The exploration animation overlays 48 recorded policy rollouts, each normalized by its own duration. The three GUI-style routes are illustrative; the visualization is not a matched-budget or wall-clock comparison. See `assets/exploration-motion/provenance.json` for source hashes and calculation details.

## Local preview

```sh
python3 -m http.server 8785 --bind 127.0.0.1
```

Open `http://127.0.0.1:8785/`. No package installation or build step is required.

## Deployment

GitHub Pages publishes the repository root from the `main` branch. `.nojekyll` preserves the static files without Jekyll processing. Push updates to `main` to publish them.
