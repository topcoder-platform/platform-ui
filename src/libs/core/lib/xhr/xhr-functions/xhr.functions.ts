import { identity } from 'lodash'
import axios, {
    AxiosHeaders,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    Method,
} from 'axios'

import { tokenGetAsync, TokenModel } from '../../auth'

// initialize the global instance when this singleton is loaded
export const globalInstance: AxiosInstance = createInstance()

export const getResonseXHeader = <T>(
    headers: AxiosHeaders,
    headerName: string,
    // eslint-disable-next-line default-param-last
    parser: any = identity,
    defaultValue?: T | undefined,
): T => (parser(headers.get(headerName)) ?? defaultValue) as T

export function createInstance(): AxiosInstance {
    // create the instance
    const created: AxiosInstance = axios.create({
        headers: {
            'Content-Type': 'application/json',
        },
    })

    // add the interceptors
    interceptAuth(created)
    interceptError(created)

    return created
}

export async function requestAsync<T, R>(
    { data, method, url }: { data: T; method: Method; url: string },
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.request({
        data,
        method,
        url,
    })
    return output.data
}

export async function deleteAsync<T>(
    url: string,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.delete(url)
    return output.data
}

export async function getAsync<T>(
    url: string,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

export async function getAsyncWithBlobHandling<T>(
    url: string,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<T | Blob> {
    const response: AxiosResponse<T | Blob> = await xhrInstance.get(url, {
        responseType: 'blob',
    })
    return response.data
}

export interface PaginatedResponse<T> {
    data: T
    total: number
    page: number
    perPage: number
    totalPages: number
}

export async function getPaginatedAsync<T>(
    url: string,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<PaginatedResponse<T>> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)

    return {
        data: output.data,
        page: getResonseXHeader(
            output.headers as AxiosHeaders,
            'x-page',
            Number,
            0,
        ),
        perPage: getResonseXHeader(
            output.headers as AxiosHeaders,
            'x-per-page',
            Number,
            0,
        ),
        total: getResonseXHeader(
            output.headers as AxiosHeaders,
            'x-total',
            Number,
            0,
        ),
        totalPages: getResonseXHeader(
            output.headers as AxiosHeaders,
            'x-total-pages',
            Number,
            0,
        ),
    }
}

export async function getBlobAsync<T>(
    url: string,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url, {
        responseType: 'blob',
    })
    return output.data
}

export async function patchAsync<T, R>(
    url: string,
    data: T,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.patch(url, data)
    return output.data
}

export async function postAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.post(url, data, config)
    return output.data
}

export async function postAsyncWithBlobHandling<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R | Blob> {
    const response: AxiosResponse<R | Blob> = await xhrInstance.post(url, data, config)
    return response.data
}

export async function putAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.put(url, data, config)
    return output.data
}

function interceptAuth(instance: AxiosInstance): void {
    // add the auth token to all xhr calls
    instance.interceptors.request.use(async config => {
        const tokenData: TokenModel = await tokenGetAsync()

        if (tokenData.token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${tokenData.token}`
        }

        return config
    })
}

async function hydrateErrorFromBlobResponse(
    responseData: unknown,
    response: AxiosResponse | undefined,
    error: any,
): Promise<boolean> {
    if (
        !responseData
        || typeof Blob === 'undefined'
        || !(responseData instanceof Blob)
    ) {
        return false
    }

    try {
        const payloadText = await responseData.text()
        if (!payloadText) {
            return true
        }

        try {
            const parsed = JSON.parse(payloadText)
            if (response) {
                response.data = parsed
            }

            error.data = parsed
        } catch {
            // fallback to plain text message if parsing fails
            error.message = payloadText
        }
    } catch {
        // ignore blob parse failures and defer to axios default behaviour
    }

    return true
}

function assignErrorMessageFromResponse(error: any, response: AxiosResponse | undefined): void {
    if (response?.data?.message) {
        error.message = response.data.message
    } else if (response?.data?.error?.message) {
        error.message = response.data.error.message
    }
}

function assignErrorCodeFromResponse(error: any, response: AxiosResponse | undefined): void {
    if (!error.code && response?.data?.code) {
        error.code = response.data.code
    }
}

function interceptError(instance: AxiosInstance): void {
    // handle all http errors
    instance.interceptors.response.use(
        config => config,
        async (error: any) => {
            const response: AxiosResponse | undefined = error?.response

            if (response?.status && !error.status) {
                error.status = response.status
            }

            const blobHandled = await hydrateErrorFromBlobResponse(
                response?.data,
                response,
                error,
            )

            if (response?.data && !error.data && !blobHandled) {
                error.data = response.data
            }

            assignErrorMessageFromResponse(error, response)
            assignErrorCodeFromResponse(error, response)

            // if there is server errors data, then return it inside `errors` property of error
            error.errors = response?.data?.errors
            return Promise.reject(error)
        },
    )
}
