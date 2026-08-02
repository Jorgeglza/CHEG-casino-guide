# CHEG Casino Guide

A visual, interactive guide to beating the house edge — one game at a time. Each game is a self-contained module with its own tabs (strategy, simulation, rules, bet reference). Currently live: **Craps**.

**Live site:** https://jorgeglza.github.io/CHEG-casino-guide/

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs static files to `dist/`.

## Project structure

```
src/
  App.tsx                 # top-level module switcher
  modules/
    craps/
      CrapsModule.tsx      # tab container for this game
      tabs/                # Strategy / Simulator / Rules / Bet Reference
      components/          # CrapsBoard (SVG), EdgeBadge
      engine/              # dice, bet math, Monte Carlo simulator
      data/                # static bet tables
```

New games get added as sibling folders under `src/modules/`, registered in `src/App.tsx`.

## Deploying to GitHub Pages (one-time manual setup)

This repo is connected to [github.com/Jorgeglza/CHEG-casino-guide](https://github.com/Jorgeglza/CHEG-casino-guide) and every push to `main` builds and deploys automatically via `.github/workflows/deploy.yml`. The one manual step that can't be done from the CLI:

1. **Enable GitHub Pages via Actions.** In the repo on GitHub: **Settings → Pages → Source**, select **GitHub Actions** (not "Deploy from a branch"). This must be done once before the first deploy will succeed — if you see a deploy step fail with `Error: HttpError: Not Found` / `Ensure GitHub Pages has been enabled`, it means this step hasn't been done yet (or wasn't saved).

2. **Re-run the deploy.** Once Pages is enabled, go to the **Actions** tab → select the failed run → **Re-run all jobs** (or just push a new commit to `main`).

3. **Site goes live at:**

   ```
   https://jorgeglza.github.io/CHEG-casino-guide/
   ```

   First deploy can take a minute or two after the workflow completes.

After this one-time setup, every future `git push` to `main` redeploys the site automatically — no further manual steps needed.
