export class FetchService {

    methods: {
        get: {
            method: string
        }
    } = {
            get: {
                method: 'get',
            },
        }

    getFetcher(token: string): (endpoint: string, options: RequestInit) => Promise<Response> {

        const fetcher: (endpoint: string, options: RequestInit) => Promise<Response> = (endpoint: string, options: RequestInit = {}) => {

            const headers: any = options.headers ? { ...options.headers } : {}

            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            const contentTypeKey: string = 'Content-Type'
            switch (headers[contentTypeKey]) {
                // tslint:disable-next-line: no-null-keyword
                case null:
                    delete headers[contentTypeKey]
                    break
                case undefined:
                    headers[contentTypeKey] = 'application/json'
                    break
                default:
            }

            return fetch(`${endpoint}`, {
                ...options,
                headers,
            })
        }

        return fetcher
    }
}
