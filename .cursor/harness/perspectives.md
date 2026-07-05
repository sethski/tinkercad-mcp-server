# Perspectives — activation and identity

Each perspective is defined by what it optimizes for, what it sacrifices, and when it activates. Not personas. Lenses.

The router selects perspectives based on domain signals in the prompt. Maximum active: read `Max perspectives` from `knobs.md`.

---

## Core perspectives (always in the selection pool)

### Architect

- **Optimizes for:** Long-term maintainability, clean boundaries, change tolerance
- **Sacrifices:** Speed of initial delivery, simplicity of first version
- **Characteristic question:** "What happens when this needs to change?"
- **Activation:** Always available; strongest signal on system design, boundaries, interfaces, dependencies

### Pragmatist

- **Optimizes for:** Shipping working software now with minimum complexity
- **Sacrifices:** Theoretical purity, future flexibility
- **Characteristic question:** "What's the simplest thing that could work?"
- **Activation:** Always available; strongest signal on implementation, scope decisions, "how to build"

### Adversary

- **Optimizes for:** Finding failure modes, attack surfaces, edge cases
- **Sacrifices:** Optimism, momentum, morale
- **Characteristic question:** "How does this break?"
- **Activation:** Always available; strongest on any system with users, state, or external dependencies

### User Advocate

- **Optimizes for:** End-user experience, clarity, reduced friction
- **Sacrifices:** Engineering elegance, internal consistency
- **Characteristic question:** "What does the person using this actually need?"
- **Activation:** Always available; strongest on UX, APIs, developer tools, onboarding, error messages

---

## Domain perspectives (activate on signal)

### Security

- **Optimizes for:** Defending trust boundaries, minimizing attack surface
- **Sacrifices:** Convenience, development speed, feature richness
- **Characteristic question:** "Who can abuse this?"
- **Activates when:** Auth, encryption, tokens, API keys, user input, file upload, CORS, CSP, permissions, data access, PII

### Performance

- **Optimizes for:** Speed, resource efficiency, scalability
- **Sacrifices:** Code simplicity, developer ergonomics
- **Characteristic question:** "What happens at 100x load?"
- **Activates when:** Database queries, caching, rendering, bundle size, latency targets, data volume, real-time, streaming

### Operations

- **Optimizes for:** Observability, reliability, recoverability
- **Sacrifices:** Feature velocity, architectural elegance
- **Characteristic question:** "How do we know when this is broken?"
- **Activates when:** Deployment, monitoring, logging, alerting, CI/CD, rollback, infrastructure, uptime, incidents

### Product

- **Optimizes for:** Business outcome, user retention, strategic alignment
- **Sacrifices:** Technical idealism, engineering satisfaction
- **Characteristic question:** "Does this move the metric that matters?"
- **Activates when:** Feature prioritization, roadmap, A/B testing, user research, competitor analysis, market fit

---

## Selection algorithm

1. **Always include:** Architect + Pragmatist (these create the fundamental tension in most engineering decisions)
2. **Add domain perspectives** if activation keywords are detected (max 2 domain perspectives)
3. **Swap core perspectives** only when irrelevant (e.g., drop User Advocate for a pure infrastructure question with no user surface)
4. **Total cap:** from `knobs.md` → `Max perspectives` (default 4)

If fewer than 2 perspectives have meaningful disagreement on the question, the question doesn't need counterpoint — downgrade to poteto and note why.

---

## Custom perspectives

Users can add perspectives in `.cursor/harness/plugins/`. See `plugins/README.md` for the format.

Custom perspectives join the domain pool and follow the same activation/cap rules.
