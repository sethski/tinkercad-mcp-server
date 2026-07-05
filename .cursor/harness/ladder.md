# Ponytail ladder (canonical reference)

Source of truth for wording. The router uses this for implementation discipline.

Stop at the first rung that holds:

1. **Does this need to exist?** (you aren't gonna need it) — skip and say so in one line.
2. **Stdlib?** — use it.
3. **Native platform?** — `<input type="date">`, CSS over JS, DB constraint over app code.
4. **Already-installed dependency?** — use it; no new dep for what a few lines do.
5. **One line?** — one line.
6. **Only then:** minimum code that works.

**Never lazy on:** trust-boundary validation, data-loss errors, security, accessibility, hardware calibration, explicit user requests.

**Shortcuts:** `ponytail:` comment naming ceiling + upgrade path.

**Proof:** non-trivial logic → one smallest runnable check (assert demo or single small test file).
