import { AxiosInstance, AxiosRequestConfig } from 'axios'

import { xhrCreateInstance, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const learnXhrInstance: AxiosInstance = xhrCreateInstance()

export async function getAsync<T>(url: string): Promise<T> {
    return xhrGetAsync(url, learnXhrInstance)
}

export async function postAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
): Promise<R> {
    return xhrPostAsync(url, data, config, learnXhrInstance)
}

export async function putAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
): Promise<R> {
    return xhrPutAsync(url, data, config, learnXhrInstance)
}
