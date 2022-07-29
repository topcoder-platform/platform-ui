import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { tokenGetAsync, TokenModel } from '../token-functions'

// initialize the instance
const xhrInstance: AxiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

// add the auth token to all xhr calls
xhrInstance.interceptors.request.use(async (config) => {
    const tokenData: TokenModel = await tokenGetAsync()
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${tokenData.token}`
    return config
})

// handle all http errors
xhrInstance.interceptors.response.use((config) => config,
    (error: any) => {

        // if there is server error message, then return it inside `message` property of error
        error.message = error?.response?.data?.message || error.message

        return Promise.reject(error)
    }
)

export async function deleteAsync<T>(url: string): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.delete(url)
    return output.data
}

export async function getAsync<T>(url: string): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

export async function getBlobAsync<T>(url: string): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url, { responseType: 'blob' })
    return output.data
}

export async function patchAsync<T, R>(url: string, data: T): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.patch(url, data)
    return output.data
}

export async function postAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.post(url, data, config)
    return output.data
}

export async function putAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.put(url, data, config)
    return output.data
}
