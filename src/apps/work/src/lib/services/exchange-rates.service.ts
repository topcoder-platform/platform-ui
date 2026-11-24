/**
 * USD to INR rate for showing member rates in rupees, from Frankfurter
 * (https://frankfurter.dev): European Central Bank reference rates, published once per working day.
 * Free, keyless, and open to browser calls (CORS `*`), so it is called straight from the browser.
 *
 * Plain `fetch` on purpose, not the app's xhr helpers: those attach the user's Topcoder token, which
 * must never be sent to a third party.
 */
const USD_INR_RATE_URL = 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=INR'

export interface ExchangeRate {
    /** INR for 1 USD. */
    rate: number
    /** `YYYY-MM-DD` the rate was published for. */
    date: string
}

interface FrankfurterRate {
    base?: string
    date?: string
    quote?: string
    rate?: number
}

// One request per page load: the rate changes once a day, and every calculator opened in the
// session shows the same one.
let cachedRate: Promise<ExchangeRate> | undefined

async function loadUsdToInrRate(): Promise<ExchangeRate> {
    const response = await fetch(USD_INR_RATE_URL, { credentials: 'omit' })

    if (!response.ok) {
        throw new Error(`Exchange rate request failed with status ${response.status}`)
    }

    const body = await response.json() as FrankfurterRate[] | FrankfurterRate
    const usdInr = (Array.isArray(body) ? body : [body])
        .find(entry => entry?.quote === 'INR')

    if (!usdInr || typeof usdInr.rate !== 'number' || !Number.isFinite(usdInr.rate) || usdInr.rate <= 0) {
        throw new Error('The exchange rate response did not include a USD to INR rate.')
    }

    return {
        date: String(usdInr.date ?? ''),
        rate: usdInr.rate,
    }
}

/**
 * The current USD to INR rate, fetched once and shared for the session. A failed request is not
 * cached, so the next caller tries again.
 */
export function fetchUsdToInrRate(): Promise<ExchangeRate> {
    if (!cachedRate) {
        cachedRate = loadUsdToInrRate()
            .catch((error: unknown) => {
                cachedRate = undefined
                throw error
            })
    }

    return cachedRate
}

/** Forgets the cached rate. For tests. */
export function resetUsdToInrRateCache(): void {
    cachedRate = undefined
}
