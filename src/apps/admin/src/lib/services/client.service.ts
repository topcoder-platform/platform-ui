import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    adjustClientInfoResponse,
    ClientInfo,
    FormEditClient,
    PaginatedResponseV6,
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
    const response = await xhrGetAsync<PaginatedResponseV6<ClientInfo>>(
        `${EnvironmentConfig.API.V6}/clients?${createFilterPageSortQuery(
            criteria,
            pageAndSort,
        )}`,
    )
    const totalPages = response.totalPages
        || (response.perPage ? Math.ceil(response.total / response.perPage) : 1)

    return {
        content: (response.data ?? []).map(adjustClientInfoResponse),
        totalPages: totalPages || 1,
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
 * Create client request data (for POST)
 * @param data client data
 * @returns request body matching CreateClientRequestDto
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
    return { param: requestData }
}

/**
 * Create client update data (for PATCH)
 * @param data client data
 * @returns request body matching UpdateClientDto
 */
const createClientPatchData = (
    data: FormEditClient,
): RequestCommonDataType => {
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
    return requestData
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
    const resultData = await xhrPatchAsync<RequestCommonDataType, ClientInfo>(
        `${EnvironmentConfig.API.V6}/clients/${clientId}`,
        createClientPatchData(data),
    )
    return resultData
}
