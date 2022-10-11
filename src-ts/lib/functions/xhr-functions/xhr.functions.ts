import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { tokenGetAsync, TokenModel } from '../token-functions'

// initialize the global instance when this singleton is loaded
export const globalInstance: AxiosInstance = createInstance()

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

export async function deleteAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.delete(url)
    return output.data
}

export async function getAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

export async function getBlobAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url, { responseType: 'blob' })
    return output.data
}

export async function patchAsync<T, R>(url: string, data: T, xhrInstance: AxiosInstance = globalInstance): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.patch(url, data)
    return output.data
}

export async function postAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>, xhrInstance: AxiosInstance = globalInstance): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.post(url, data, config)
    return output.data
}

export async function putAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>, xhrInstance: AxiosInstance = globalInstance): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.put(url, data, config)
    return output.data
}

function interceptAuth(instance: AxiosInstance): void {

    // add the auth token to all xhr calls
    instance.interceptors.request.use(async (config) => {
        const tokenData: TokenModel = await tokenGetAsync()

        if (tokenData.token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${tokenData.token}`
        }

        return config
    })
}

function interceptError(instance: AxiosInstance): void {

    // handle all http errors
    instance.interceptors.response.use((config) => config,
        (error: any) => {

            // if there is server error message, then return it inside `message` property of error
            error.message = error?.response?.data?.message || error.message
            // if there is server errors data, then return it inside `errors` property of error
            error.errors = error?.response?.data?.errors

            return Promise.reject(error)
        }
    )
}
