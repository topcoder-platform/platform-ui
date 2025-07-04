/**
 * Billing accounts service
 */
import _ from 'lodash'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    adjustBillingAccountResponse,
    ApiV3Response,
    BillingAccount,
    BillingAccountResource,
    FormEditBillingAccount,
    FormNewBillingAccountResource,
    RequestCommonDataType,
} from '../models'
import { createFilterPageSortQuery } from '../utils'

/**
 * Fetch all billing accounts
 * @param criteria search criteria
 * @param pageAndSort pagination and sort
 * @returns resolves to the array of billing account objects
 */
export const searchBillingAccounts = async (
    criteria: { [key: string]: string | number | Date | undefined | null },
    pageAndSort: {
        limit: number
        page: number
        sort: string
    },
): Promise<{
    content: BillingAccount[]
    totalPages: number
}> => {
    const data = await xhrGetAsync<ApiV3Response<BillingAccount[]>>(
        `${
            EnvironmentConfig.API.V3
        }/billing-accounts?${createFilterPageSortQuery(criteria, pageAndSort)}`,
    )
    const totalCount = data.result.metadata.totalCount
    return {
        content: data.result.content.map(adjustBillingAccountResponse),
        totalPages: Math.ceil(totalCount / pageAndSort.limit),
    }
}

/**
 * Find all billing account resources
 * @param accountId account id
 * @returns resolves to the array of billing account resource objects
 */
export const findAllBillingAccountResources = async (
    accountId: string,
): Promise<BillingAccountResource[]> => {
    const data = await xhrGetAsync<ApiV3Response<BillingAccount[]>>(
        `${EnvironmentConfig.API.V3}/billing-accounts/${accountId}/users`,
    )
    return data.result.content
}

/**
 * Find billing account by id
 * @param id billing account id
 * @param pageAndSort pagination and sort
 * @returns resolves to the billing account object
 */
export const findBillingAccountById = async (
    id: string,
): Promise<BillingAccount> => {
    const data = await xhrGetAsync<ApiV3Response<BillingAccount>>(
        `${EnvironmentConfig.API.V3}/billing-accounts/${id}`,
    )
    return adjustBillingAccountResponse(data.result.content)
}

/**
 * Delete billing account
 * @param accountId billing account id
 * @param resourceId resource id
 * @returns resolves to the result success or fail
 */
export const deleteBillingAccountResource = async (
    accountId: string,
    resourceId: string,
): Promise<void> => {
    await xhrDeleteAsync<void>(
        `${EnvironmentConfig.API.V3}/billing-accounts/${accountId}/users/${resourceId}`,
    )
}

/**
 * Create billing account request data
 * @param data billing account data
 * @returns request data
 */
const createBillingAccountRequestData = (
    data: FormEditBillingAccount,
): {
    param: RequestCommonDataType
} => {
    const requestData: RequestCommonDataType = {
        clientId: data.client.id,
        endDate: `${data.endDate.toISOString()
            .substring(0, 16)}Z`,
        salesTax: data.salesTax,
        startDate: `${data.startDate.toISOString()
            .substring(0, 16)}Z`,
    }
    if (data.paymentTerms) {
        requestData.paymentTerms = {
            id: data.paymentTerms,
        }
    }

    _.forEach(
        [
            'name',
            'companyId',
            'status',
            'budgetAmount',
            'poNumber',
            'subscriptionNumber',
            'description',
        ],
        key => {
            const value = (data as unknown as RequestCommonDataType)[key]
            if (value !== null && value !== undefined) {
                requestData[key] = value
            }
        },
    )
    return {
        param: requestData,
    }
}

/**
 * Create billing account
 * @param data billing account data
 * @returns resolves to the array of billing account object
 */
export const createBillingAccount = async (
    data: FormEditBillingAccount,
): Promise<BillingAccount[]> => {
    const resultData = await xhrPostAsync<
        {
            param: RequestCommonDataType
        },
        ApiV3Response<BillingAccount[]>
    >(
        `${EnvironmentConfig.API.V3}/billing-accounts`,
        createBillingAccountRequestData(data),
    )
    return resultData.result.content
}

/**
 * Edit billing account
 * @param accountId billing account id
 * @param data billing account data
 * @returns resolves to the billing account object
 */
export const editBillingAccount = async (
    accountId: string,
    data: FormEditBillingAccount,
): Promise<{
    original: BillingAccount
    updated: BillingAccount
}> => {
    const resultData = await xhrPatchAsync<
        {
            param: RequestCommonDataType
        },
        ApiV3Response<{
            original: BillingAccount
            updated: BillingAccount
        }>
    >(
        `${EnvironmentConfig.API.V3}/billing-accounts/${accountId}`,
        createBillingAccountRequestData(data),
    )
    return resultData.result.content
}

/**
 * Create billing account
 * @param accountId billing account id
 * @param data billing account data
 * @returns resolves to billing account object
 */
export const createBillingAccountResource = async (
    accountId: string,
    data: FormNewBillingAccountResource,
): Promise<BillingAccountResource> => {
    const resultData = await xhrPostAsync<
        {
            param: RequestCommonDataType
        },
        ApiV3Response<BillingAccountResource>
    >(`${EnvironmentConfig.API.V3}/billing-accounts/${accountId}/users`, {
        param: {
            userId: data.userId,
        },
    })
    return resultData.result.content
}
