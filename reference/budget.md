# Reference budget — commit drafts

Thresholds for when the agent stages a commit draft.

| Setting | Value | Notes |
|---------|-------|-------|
| **Commit draft interval** | `10` | Prompts since last commit draft → evaluate |
| **Significance: new files** | `2` | >= N new files in session → always draft |
| **Significance: keywords** | `feature`, `refactor`, `migration`, `fix` | Any match → always draft |
| **Commit draft behavior** | `ask` | `ask` / `auto` / `off` |
| **QA before commit** | `on` | `on` / `off` |
| **QA trigger** | harness changes | Run QA when staged changes touch `.cursor/` or `reference/` |
| **QA blocks confirm** | `yes` | `yes` / `warn` |
