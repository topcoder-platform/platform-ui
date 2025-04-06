import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'

import {
    adjustClientInfoResponse,
    ApiV3Response,
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
    const data = await xhrGetAsync<ApiV3Response<ClientInfo[]>>(
        `${EnvironmentConfig.API.V3}/clients?${createFilterPageSortQuery(
            criteria,
            pageAndSort,
        )}`,
    )
    const totalCount = data.result.metadata.totalCount
    return {
        content: data.result.content.map(adjustClientInfoResponse),
        totalPages: Math.ceil(totalCount / pageAndSort.limit),
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
    const data = await xhrGetAsync<ApiV3Response<ClientInfo>>(
        `${EnvironmentConfig.API.V3}/clients/${clientId}`,
    )
    return adjustClientInfoResponse(data.result.content)
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
        ApiV3Response<ClientInfo>
    >(`${EnvironmentConfig.API.V3}/clients`, createClientRequestData(data))
    return resultData.result.content
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
        ApiV3Response<ClientInfo>
    >(
        `${EnvironmentConfig.API.V3}/clients/${clientId}`,
        createClientRequestData(data),
    )
    return resultData.result.content
}
