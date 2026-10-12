# Hermes Error & Recovery Tracker

A unified Hermes plugin with a native desktop page and a read-only backend. It shows:

- Up to 150 recent nonblank lines from `$HERMES_HOME/logs/errors.log`.
- Up to 150 recent cron recovery events from `$HERMES_HOME/cron/persisted_error_recoveries.jsonl`.

The recovery view reports persisted stale-error re-arms recorded by Hermes. This plugin displays recovery telemetry; it does **not** run repairs or change jobs. It makes no third-party network requests and ships no local logs, configuration, credentials, or recovery records.

## Install

Install the unified package directly from GitHub and enable it:

```sh
hermes plugins install gnanasreekar/Hermes-error-self-repair --enable
```

The package includes the agent entry point, read-only backend, and native desktop page. Restart the Hermes gateway after installation so its API route is mounted. The backend exposes `GET /api/plugins/error-tracker/errors` through the plugin-scoped API.

## Development checks

```sh
hermes plugins validate .
python -m unittest discover -s tests
node --input-type=module --check < desktop/plugin.js
```
