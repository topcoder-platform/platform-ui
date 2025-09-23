import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    adjustClientInfoResponse,
    ClientInfo,
    FormEditClient,
    RequestCommonDataType,
} from '../models'
import { createFilterPageSortQuery } from '../utils'

/**
 * Get a list of all the clients
 * @param criteria search criteria
 * @param pageAndSort pagination and sort
 * @returns resolves to the array of client objects
 */
export const searchClients = async (
    criteria: { [key: string]: string | number | Date | undefined | null },
    pageAndSort: {
        limit: number
        page: number
        sort: string
    },
): Promise<{
    content: ClientInfo[]
    totalPages: number
}> => {
    const { data, totalPages }: {
        data: ClientInfo[]
        totalPages: number
    } = await xhrGetPaginatedAsync<ClientInfo[]>(
        `${EnvironmentConfig.API.V6}/clients?${createFilterPageSortQuery(
            criteria,
            pageAndSort,
        )}`,
    )
    return {
        content: data.map(adjustClientInfoResponse),
        totalPages,
    }
}

/**
 * Find client by id
 * @param clientId client id
 * @returns resolves to the client object
 */
export const findClientById = async (
    clientId: number | string,
): Promise<ClientInfo> => {
    const data = await xhrGetAsync<ClientInfo>(
        `${EnvironmentConfig.API.V6}/clients/${clientId}`,
    )
    return adjustClientInfoResponse(data)
}

/**
 * Create client request data
 * @param data client data
 * @returns request data
 */
const createClientRequestData = (
    data: FormEditClient,
): {
    param: RequestCommonDataType
} => {
    const requestData: RequestCommonDataType = {
        endDate: `${data.endDate.toISOString()
            .substring(0, 16)}Z`,
        startDate: `${data.startDate.toISOString()
            .substring(0, 16)}Z`,
    }
    _.forEach(['name', 'codeName', 'status'], key => {
        const value = (data as unknown as RequestCommonDataType)[key]
        if (value !== null && value !== undefined) {
            requestData[key] = value
        }
    })
    return {
        param: requestData,
    }
}

/**
 * Create client
 * @param data client data
 * @returns resolves to the array of client object
 */
export const createClient = async (
    data: FormEditClient,
): Promise<ClientInfo> => {
    const resultData = await xhrPostAsync<
        {
            param: RequestCommonDataType
        },
        ClientInfo
    >(`${EnvironmentConfig.API.V6}/clients`, createClientRequestData(data))
    return resultData
}

/**
 * Edit client
 * @param clientId client id
 * @param data client data
 * @returns resolves to the client object
 */
export const editClient = async (
    clientId: string,
    data: FormEditClient,
): Promise<ClientInfo> => {
    const resultData = await xhrPatchAsync<
        {
            param: RequestCommonDataType
        },
        ClientInfo
    >(
        `${EnvironmentConfig.API.V6}/clients/${clientId}`,
        createClientRequestData(data),
    )
    return resultData
}
