# NautIQ — Claude Code Instructions

## After every feature update

When completing any user-facing feature or change, always do both of the following before committing:

### 1. Update the What's New card (`src/lib/changelog.ts`)

- If the current date matches the existing `CHANGELOG[0].date`, add the new feature as a bullet to `CHANGELOG[0].features`.
- If this is a new day, prepend a new entry to the top of `CHANGELOG` array with today's date, a descriptive label (e.g. "July 2026 update"), and the feature list.
- Keep bullet text concise and user-friendly — describe what the user can now do, not the implementation detail.

### 2. Update the help content (`src/lib/help-content.ts`)

- Add or update the relevant `HELP_SECTIONS` entry so users can find how to use the new feature.
- Update `HELP_SYSTEM_PROMPT` so the AI assistant can answer "how do I" questions about the feature.
- If the feature doesn't fit an existing section, add a new one.

## Key files

| File | Purpose |
|------|---------|
| `src/lib/changelog.ts` | What's New release notes — shown in chat on login |
| `src/lib/help-content.ts` | Help page content + AI assistant help system prompt |
| `src/components/chat/whats-new-card.tsx` | Dismissible notification card rendered in chat |
| `src/app/globals.css` | `.btn-primary` gradient class — use on all primary buttons |

## Branch

Always develop on `claude/trusting-cray-y4f6sm`. Never push to `main`.
