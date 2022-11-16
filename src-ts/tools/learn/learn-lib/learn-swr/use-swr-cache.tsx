import { mutate, SWRConfiguration } from 'swr'

let cacheMap: any = {} as any

if (typeof window !== 'undefined') {
    try {
        // load all cached data from localstorage
        cacheMap = JSON.parse(localStorage.getItem('swr-cached') ?? '{}')
    } catch {}

    // parse the loaded data, and load it into swr's in-memory cache
    if (cacheMap) {
        Object.entries(cacheMap)
            .forEach(([key, data]) => {
                mutate(key, data, { revalidate: false })
            })
    }
}

export function useSwrCache<T>(key: string): SWRConfiguration {
    // return handlers to store and clear localstorage data
    return {
        onError(): void {
            cacheMap[key] = undefined
            localStorage.setItem('swr-cached', JSON.stringify(cacheMap))
        },
        onSuccess(data: T): void {
            cacheMap[key] = data
            localStorage.setItem('swr-cached', JSON.stringify(cacheMap))
        },
    }
}
