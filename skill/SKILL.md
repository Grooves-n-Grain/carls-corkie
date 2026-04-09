---
name: corkboard_dashboard
description: Post and manage real-time corkboard pins, lamp cues, deleted-history recovery, and multi-track project pipeline work for the Carl's Corkie dashboard. Use when you need to surface actionable tasks, alerts, opportunities, links, briefings, package tracking, article summaries, YouTube videos, or cellar ideas on the board.
homepage: https://github.com/zheroz00/carls-corkie
metadata: {"openclaw":{"emoji":"📌"}}
---

# Corkboard Dashboard

Use this skill when you need to put something actionable on the board right now. Prefer a pin for one-off work or a project for multi-step work with tracks, handoffs, and task checklists.

## Quick Start

1. Install or update the dashboard:
```bash
export CORKBOARD_REPO="https://github.com/zheroz00/carls-corkie.git"   # first-time installs only
bash {baseDir}/scripts/install.sh
```

2. Point tooling at the running API. Use `localhost` on the same machine or the machine's LAN IP from another trusted device:
```bash
CORKBOARD_API=http://localhost:3010
# or
CORKBOARD_API=http://<lan-ip>:3010
```

3. Post work with the bundled helper:
```bash
bash {baseDir}/scripts/corkboard.sh add task "Review PR" "Auth refactor complete" 1
bash {baseDir}/scripts/corkboard.sh add alert "Server down" "API returning 503s" 1
bash {baseDir}/scripts/corkboard.sh add link "Error logs" "https://logs.example.com/errors"
bash {baseDir}/scripts/corkboard.sh add-opportunity "Wholesale inquiry" "Follow up with studio buyer" 2
bash {baseDir}/scripts/corkboard.sh add-briefing "Morning briefing" "## Today\n- Ship the fix\n- Reply to supplier"
```

4. Use the REST API directly for projects, cellar ideas, history/restore, track updates, and lamp state:
```bash
curl -X POST "$CORKBOARD_API/api/pins" \
  -H "Content-Type: application/json" \
  -d '{"type":"task","title":"Review PR","content":"Auth refactor complete","priority":1}'

curl -X POST "$CORKBOARD_API/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Launch blog","emoji":"✍️","phase":"build","tracks":[{"name":"Write posts","owner":"claude"},{"name":"Review","owner":"you"}]}'
```

## Pick The Right Surface

- Use a `pin` for one-off tasks, alerts, links, notes, briefings, tracking updates, or short-lived reminders.
- Use a `project` for multi-step work with phases, tracks, and task lists shared between the agent and the human.
- Use `projectStatus: "cellar"` or `POST /api/projects/:id/cellar` for future ideas that should stay off the active board until they are ready.
- Tracks are owned by `claude`, `you`, or `shared`; finishing a track can automatically create a follow-up task pin for the next handoff.
- Use deleted pin history plus restore routes when something should come back to the board instead of being recreated from scratch.
- Prefer `priority: 1` for urgent work, `2` for the normal default, and `3` for low urgency.
- Keep the dashboard on a trusted LAN. This setup is intentionally unauthenticated.

## Common Actions

```bash
bash {baseDir}/scripts/corkboard.sh list
bash {baseDir}/scripts/corkboard.sh complete <pin-id>
bash {baseDir}/scripts/corkboard.sh delete <pin-id>
bash {baseDir}/scripts/corkboard.sh add-email <from> <subject> [preview] [email_id]
bash {baseDir}/scripts/corkboard.sh add-github <owner/repo> [description] [stars] [forks]
bash {baseDir}/scripts/corkboard.sh add-idea <title> [verdict] [summary] [scores_json] [competitors] [effort]
bash {baseDir}/scripts/corkboard.sh add-tracking <number> <carrier> [status] [eta] [url]
bash {baseDir}/scripts/corkboard.sh add-article <title> <url> <source> <tldr> [bullets_json] [tags_json]
bash {baseDir}/scripts/corkboard.sh add-opportunity <title> [content] [priority]
bash {baseDir}/scripts/corkboard.sh add-briefing <title> <content>
bash {baseDir}/scripts/corkboard.sh add-twitter <title> <content> [url]
bash {baseDir}/scripts/corkboard.sh add-reddit <title> <content> [url]
bash {baseDir}/scripts/corkboard.sh add-youtube <youtube-url>
curl "$CORKBOARD_API/api/pins/history/deleted"
curl -X POST "$CORKBOARD_API/api/pins/<pin-id>/restore"
curl -X POST "$CORKBOARD_API/api/projects/<project-id>/cellar"
curl -X POST "$CORKBOARD_API/api/lamp/waiting"
```

## References

- API routes, socket events, project statuses, track attachments, deleted-history behavior, and lamp controls: `{baseDir}/references/api.md`
- Install, LAN access, env vars, helper script usage, and trusted-network notes: `{baseDir}/references/setup.md`
- Pin types, specialized payload shapes, and example request bodies: `{baseDir}/references/pin-types.md`
