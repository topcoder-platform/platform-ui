# Runner Component

The Runner component drives end-to-end flow execution inside the tester app. It opens an SSE stream to the backend, renders real-time logs and progress, tracks step status, and surfaces challenge snapshots and review results alongside captured request/response details.

## Features

- SSE streaming for logs, progress, and step events.
- Status grid with per-step request counts and error badges.
- Challenge snapshot timeline with JSON syntax highlighting.
- Automatic reviews fetch when a new challenge refresh arrives.
- Request/response modals with copy-to-clipboard helpers.
- Connection status tracking with reconnection and error messaging.

## Props

- `flow: FlowVariant` selects the flow definition and step list.
- `mode: 'full' | 'toStep'` controls full execution or stopping at a step.
- `toStep?: string` is used when `mode` is `toStep` to select the stop step.

## State and refs

- `runToken` is incremented to re-initialize the SSE connection and reset state.
- Logs, progress, step statuses, and requests are managed in local state for live UI updates.
- Challenge snapshots are stored as a list, while reviews and review metadata are fetched on demand.
- Refs track the active `EventSource`, reconnect attempts, and in-flight review fetches so cleanup is reliable.

## SSE event handling

The stream sends JSON payloads in `data:` frames:

- Log events:
  - `{ level, message, data?, progress? }`
  - `progress` updates the progress bar.
  - `message: 'Challenge refresh'` with `data.challenge` triggers a snapshot.
- Step events:
  - `{ type: 'step', step, status, requests?, failedRequests?, timestamp }`
  - `status` is normalized (`in-progress` -> `running`, `failure` -> `error`).
  - `requests` and `failedRequests` are stored per step for the request modals.

When a challenge refresh arrives, the component extracts the challenge ID from `id`, `challengeId`, or `challenge.id`, then fetches reviews for that ID.

## Error handling and cleanup

- Reconnects up to 3 times with incremental backoff (1s, 2s, 3s).
- Connection status drives the UI label and error message for stream failures.
- EventSource connections, timeouts, and AbortControllers are closed or cancelled on restart or unmount.

