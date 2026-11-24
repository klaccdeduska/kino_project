# Contributing to BUBLIKI

Use one short-lived branch and pull request per issue. Start from an up-to-date `main` and give the branch a name that describes the issue.

```sh
git switch main
git pull --ff-only
git switch -c fix/12-catalogue-headings
```

## Keep commits focused

- Put one logical change in each commit. Review `git diff --staged` before committing. Use `git add -p` when a file contains work for multiple issues.
- Start commit titles with an imperative verb such as `Add`, `Fix` or `Remove`. Name the behavior or file affected, and include the issue number. For example, `Fix catalogue heading hierarchy (#12)`.
- Keep unrelated cleanup and formatting separate from behavior changes. Add a short commit body when the reason or data impact needs explanation.

## Open and review the pull request

Push your branch and open a pull request targeting `main`. Reference the issue, describe the change, and list the checks you ran. Include upgrade steps and the effect on existing data when a migration is involved. Use `Closes #12` in the pull request description when merging it should close the issue.

Ask a teammate to review the changes and checks before merging. After merging, delete the feature branch once it has no remaining work or open pull requests. Keep published `main` history intact and correct mistakes with a follow-up commit.

See the [project guide](docs/README.md) for setup and verification commands.
