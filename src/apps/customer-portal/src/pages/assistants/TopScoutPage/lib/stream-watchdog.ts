// The chat SSE stream can die without a proper HTTP error — an idle
// intermediary (ALB, proxy) between the browser and tc-ai-api can reset a
// quiet connection (e.g. mid tool-call, before any token has streamed) with
// no status code at all. `fetch`'s reader then just never resolves again,
// so `useChat` sits in "running" state forever with nothing on screen.
//
// tc-ai-api's chatRoute sends a heartbeat comment every 15s specifically to
// avoid that, but this watchdog is the client-side backstop: if no bytes
// (heartbeat or real data) arrive within `stallTimeoutMs`, the response
// stream is force-errored so `useChat`'s onError fires and recovery can run.
const DEFAULT_STALL_TIMEOUT_MS = 40_000

export function withStallWatchdog(
    baseFetch: typeof fetch,
    stallTimeoutMs: number = DEFAULT_STALL_TIMEOUT_MS,
): typeof fetch {
    return async (input, init) => {
        const response = await baseFetch(input, init)

        if (!response.body) {
            return response
        }

        const reader = response.body.getReader()

        const watchedBody = new ReadableStream<Uint8Array>({
            cancel(reason: unknown) {
                return reader.cancel(reason)
            },
            start(controller: ReadableStreamDefaultController<Uint8Array>) {
                let timeoutId: ReturnType<typeof setTimeout>

                function clearWatchdog(): void {
                    clearTimeout(timeoutId)
                }

                function armWatchdog(): void {
                    clearWatchdog()
                    timeoutId = setTimeout(() => {
                        reader.cancel('TopScout stream stalled')
                            .catch(() => undefined)
                        controller.error(new Error('TopScout response stalled — no data received in time'))
                    }, stallTimeoutMs)
                }

                function pump(): void {
                    reader.read()
                        .then(({ done, value }: ReadableStreamReadResult<Uint8Array>) => {
                            if (done) {
                                clearWatchdog()
                                controller.close()
                                return
                            }

                            armWatchdog()
                            controller.enqueue(value)
                            pump()
                        })
                        .catch((error: unknown) => {
                            clearWatchdog()
                            controller.error(error)
                        })
                }

                armWatchdog()
                pump()
            },
        })

        return new Response(watchedBody, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
        })
    }
}
