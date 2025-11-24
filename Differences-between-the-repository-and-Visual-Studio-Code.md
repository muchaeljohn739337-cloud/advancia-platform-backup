# Differences Between the Repository and Visual Studio Code

This cheatsheet clarifies what “the repository” is vs what “Visual Studio Code (VS Code)” is, and how they work together in this project.

## Source of Truth

-   Repository: Your project’s files tracked by Git, stored locally and synced to GitHub. Default branch is `main`; you’re currently working on `preview-clean`.
-   VS Code: A code editor and tooling environment. It does not store the canonical history of your project by itself; Git does.

## Where Changes Live

-   Working tree: Unsaved or saved file edits on your machine. Not shared until committed and pushed.
-   Staged changes: Files added with `git add` waiting to be committed.
-   Commits: Snapshots recorded in Git history locally.
-   Remote (GitHub): Commits pushed to GitHub (e.g., `origin/main`). CI/CD and deploy hooks read from here.
-   VS Code Edit Sessions: Optional cloud snapshot of your uncommitted editor state for resuming on another device. This is not a substitute for Git and does not deploy your app.

## Automation & Deployments

-   GitHub Actions (in repo): Defined under `.github/workflows/`. They run on GitHub after events like pushes or manual triggers. This repo now uses a Render-only deploy at `.github/workflows/deploy.yml`.
-   Render deploy (server): Triggered by a deploy hook secret. Builds backend from the repo’s current state.
-   Vercel deploy (frontend): Builds your Next.js app from the repo’s current state.
-   VS Code tasks: Local helpers you run on your machine. They don’t deploy by themselves and don’t replace CI.

## Env Vars & Secrets

-   GitHub Actions secrets: Used only by workflows (e.g., `RENDER_DEPLOY_HOOK_URL_BACKEND`).
-   Render/Vercel env vars: Set in their dashboards for runtime and builds.
-   Local `.env`: For local development only; do not commit secrets.
-   VS Code: Never hardcode secrets in code. Use env vars and secret stores.

## Settings & Tooling

-   `.vscode/` folder: Workspace settings and recommended extensions for this project only.
-   User settings: Your global VS Code preferences (outside the repo).
-   Pre-commit hooks (Husky): Run locally when you commit (e.g., markdownlint to enforce MD034/MD040). VS Code shows their output, but Git enforces the gate.

## Common Pitfalls

-   “I saved in VS Code, why isn’t it live?” You must commit and push for GitHub/Render/Vercel to see changes.
-   “Workflow didn’t run.” Check branch filters (e.g., deploy triggers on `main`) or run the workflow manually.
-   “CI failed with frozen lockfile.” Commit the updated `pnpm-lock.yaml` alongside `package.json`.
-   “Old droplet jobs ran.” We deprecated droplet workflows; only the Render workflow should be used for backend deploys.

## Practical Flow (Backend)

1. Edit code in VS Code, save.
2. Test locally if needed (tasks, scripts).
3. Commit and push.
4. Trigger deploy: GitHub → Actions → “Deploy Backend (Render)” → Run workflow, or push to `main` if configured.
5. Verify health: `<https://advancia-backend.onrender.com/api/health>`.

## Practical Flow (Frontend)

1. Edit in VS Code, save, test locally.
2. Commit and push.
3. Vercel builds on push (or trigger manually). Ensure `NEXT_PUBLIC_*` vars are set in Vercel.

## Helpful References

-   VS Code workspaces: `<https://code.visualstudio.com/docs/editor/workspaces>`
-   Git basics: `<https://git-scm.com/docs/gittutorial>`

If anything remains unclear, ask for an example with the exact file or workflow you’re working on and I’ll tailor the steps.
