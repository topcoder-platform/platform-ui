const REQUEST_INTERVAL_MS = 500
let nextRequest: Promise<unknown> = Promise.resolve()

/**
 * Schedules billing detail lookups through one shared queue so opening a large
 * account cannot burst hundreds of requests at the challenge and finance APIs.
 * Each request settles before the next begins, with a half-second gap. A failed
 * request releases the queue; the caller decides which row fallback to display.
 * @param values Unique identifiers to hydrate, in display-independent order.
 * @param fetchDetail Asynchronous lookup for one identifier.
 * @returns Results in input order after all lookups settle successfully.
 * @throws Propagates lookup errors without blocking subsequent queued requests.
 */
export async function loadBillingDetails<T>(
    values: string[],
    fetchDetail: (value: string) => Promise<T>,
): Promise<T[]> {
    return Promise.all(values.map(value => {
        const request = nextRequest.then(() => fetchDetail(value))
        nextRequest = request.catch(() => undefined)
            .then(() => new Promise<void>(resolve => {
                setTimeout(resolve, REQUEST_INTERVAL_MS)
            }))
        return request
    }))
}
