import { AxiosInstance, AxiosRequestConfig } from 'axios'

import { xhrCreateInstance, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import { create as learnCreate, LearnResponseModel } from './learn.factory'

const learnXhrInstance: AxiosInstance = xhrCreateInstance()

// handle all created and updated dates
learnXhrInstance.interceptors.response
    .use(response => {

        if (Object.prototype.hasOwnProperty.call(response.data, 'createdAt')) {
            response.data = learnCreate(response.data)

        } else if (response.data?.constructor?.name === 'Array') {
            response.data = response.data
                .map(<T extends LearnResponseModel>(item: T) => learnCreate(item))
        }

        return response
    })

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
