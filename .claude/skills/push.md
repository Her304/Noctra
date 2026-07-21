# Skill: push

Push the current branch to origin for the Noctra project.

## Steps

1. Run `git status` to check for any uncommitted changes. If there are staged but uncommitted changes, warn the user and ask if they want to commit first before pushing.

2. Run `git branch --show-current` to confirm the active branch.

3. Warn the user if the current branch is `main` — pushing directly to main should be intentional. Ask for confirmation before proceeding.

4. Run `git push -u origin <current-branch>` to push.

5. Report the result: branch name, remote URL, and the GitHub PR creation link if shown in the output.

## Notes

- Remote is `git@github.com:Her304/Noctra.git` (SSH, already configured)
- Never force-push unless the user explicitly says so
- If the push fails due to diverged history, explain the situation and ask how to proceed — do not auto-rebase or auto-merge
