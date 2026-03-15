# Health Guardian Skill

## Description
Automatically monitors and repairs OpenClaw health issues.

## Triggers
- Scheduled: every 30 minutes (via cron)
- On-demand: /health-guardian run

## Actions
1. **Check Gateway**: Run openclaw gateway status. If not running, attempt restart.
2. **Check Port Conflict**: Run 
etstat -ano | findstr :18789. If multiple processes found, kill oldest and restart.
3. **Clean Stale Locks**: Remove old *.lock files from sessions directory.
4. **Log Outcome**: Record actions to memory/health-guardian.log.
