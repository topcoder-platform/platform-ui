import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { xhrCreateInstance, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '../../../../lib'

import { create as learnCreate } from './learn.factory'

const learnXhrInstance: AxiosInstance = xhrCreateInstance()

// handle all created and updated dates
learnXhrInstance.interceptors.response
    .use((response) => {

        if (response.data?.hasOwnProperty('createdAt')) {
            response.data = learnCreate(response.data)

        } else if (response.data?.constructor?.name === 'Array') {
            response.data = response.data
                .map((item: any) => learnCreate(item))
        }

        return response
    })

export async function getAsync<T>(url: string): Promise<T> {
    return xhrGetAsync(url, learnXhrInstance)
}

export async function postAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>): Promise<R> {
    return xhrPostAsync(url, data, config, learnXhrInstance)
}

export async function putAsync<T, R>(url: string, data: T, config?: AxiosRequestConfig<T>): Promise<R> {
    return xhrPutAsync(url, data, config, learnXhrInstance)
}
