# CHEG Casino Guide

A visual, interactive guide to beating the house edge — one game at a time. Each game is a self-contained module with its own tabs (strategy, simulation, rules, bet reference). Currently live: **Craps**.

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

This repo is not yet connected to GitHub. To publish it:

1. **Create the GitHub repo.** On github.com, create a new **public** repository named `CHEG-casino-guide` (must match the `base` path in `vite.config.ts` — update that value if you use a different name).

2. **Push this folder to it:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: craps module"
   git branch -M main
   git remote add origin https://github.com/<your-username>/CHEG-casino-guide.git
   git push -u origin main
   ```

3. **Enable GitHub Pages via Actions.** In the repo on GitHub: **Settings → Pages → Source**, select **GitHub Actions** (not "Deploy from a branch").

4. **Push triggers the deploy.** The workflow at `.github/workflows/deploy.yml` builds and publishes automatically on every push to `main`. Check the **Actions** tab for progress.

5. **Site goes live at:**

   ```
   https://<your-username>.github.io/CHEG-casino-guide/
   ```

   First deploy can take a minute or two after the workflow completes.

After this one-time setup, every future `git push` to `main` redeploys the site automatically — no further manual steps needed.
