# Recursive Game Creator

Research project website for **Recursive Game Creator: An Agentic Product-Level Experience-Oriented Game Harness**.

**Website:** https://rsigamecreator.github.io/

This repository contains the static project page, manuscript PDF, research figures, game screenshots, and gameplay videos. It does not contain the agent framework, game source projects, training or evaluation runs, or credentials.

## Contents

- `index.html`, `styles.css`, `app.js`: project page and interactive comparisons.
- `meme-arena-video.html`: dedicated player for the three-version gameplay comparison.
- `assets/`: manuscript PDF, research figures, screenshots, and provenance notes.
- `videos/meme-arena/`: comparison film, individual version captures, posters, and capture notes.

Meme Arena V1/V2 use restored development snapshots. See the page and `videos/meme-arena/README.txt` for details. The gameplay film uses matched scripted staging and is not a benchmark replay.

## Local preview

```sh
python3 -m http.server 8785 --bind 127.0.0.1
```

Open `http://127.0.0.1:8785/`. No package installation or build step is required.

## Deployment

GitHub Pages publishes the repository root from the `main` branch. `.nojekyll` preserves the static files without Jekyll processing. Push updates to `main` to publish them.
