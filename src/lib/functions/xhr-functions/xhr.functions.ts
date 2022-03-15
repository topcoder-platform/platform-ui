import axios, { AxiosInstance, AxiosResponse } from 'axios'

import { get as tokenGet, TokenModel } from '../token-functions'

// initialize the instance
const xhrInstance: AxiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

// add the auth token to all xhr calls
xhrInstance.interceptors.request.use(async (config) => {
    const tokenData: TokenModel = await tokenGet()
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

export async function get<T>(url: string): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

export async function patch<T>(url: string, data: T): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.patch(url, data)
    return output.data
}

export async function put<T>(url: string, data: T): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.put(url, data)
    return output.data
}
