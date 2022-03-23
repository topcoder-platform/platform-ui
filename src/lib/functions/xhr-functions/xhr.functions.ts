import axios, { AxiosInstance, AxiosResponse } from 'axios'

<<<<<<< HEAD
import { get as tokenGet, TokenModel } from '../token-functions'
=======
import { tokenGetAsync, TokenModel } from '../token-functions'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

// initialize the instance
const xhrInstance: AxiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

// add the auth token to all xhr calls
xhrInstance.interceptors.request.use(async (config) => {
<<<<<<< HEAD
    const tokenData: TokenModel = await tokenGet()
=======
    const tokenData: TokenModel = await tokenGetAsync()
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
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

<<<<<<< HEAD
export async function get<T>(url: string): Promise<T> {
=======
export async function getAsync<T>(url: string): Promise<T> {
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

<<<<<<< HEAD
export async function patch<T, R>(url: string, data: T): Promise<R> {
=======
export async function patchAsync<T, R>(url: string, data: T): Promise<R> {
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    const output: AxiosResponse<R> = await xhrInstance.patch(url, data)
    return output.data
}

<<<<<<< HEAD
export async function put<T>(url: string, data: T): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.put(url, data)
=======
export async function putAsync<T, R>(url: string, data: T): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.put(url, data)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    return output.data
}
