/**
 * Terms service
 */
import { EnvironmentConfig } from '~/config'
import {
    PaginatedResponse,
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    ApiV5ResponseSuccess,
    FormAddTerm,
    TermAgreeabilityType,
    TermType,
    UserTerm,
} from '../models'

/**
 * Fetch all terms list.
 * @param filter the filter.
 * @returns resolves to the terms list.
 */
export const fetchAllTerms = async (
    filter: string,
): Promise<
    PaginatedResponse<{
        result: UserTerm[]
    }>
> => {
    const result = await xhrGetPaginatedAsync<{
        result: UserTerm[]
    }>(`${EnvironmentConfig.API.V5}/terms?${filter}`)
    return result
}

/**
 * Fetch term by id.
 * @param termsId the term id.
 * @returns resolves to the term info.
 */
export const findTermsById = async (termsId: string): Promise<UserTerm> => {
    const result = await xhrGetAsync<UserTerm>(
        `${EnvironmentConfig.API.V5}/terms/${termsId}`,
    )
    return result
}

/**
 * Fetch all terms types.
 * @returns resolves to the terms types list.
 */
export const fetchAllTermsTypes = async (): Promise<TermType[]> => {
    const result = await xhrGetAsync<TermType[]>(
        `${EnvironmentConfig.API.V5}/terms/types`,
    )
    return result
}

/**
 * Fetch all terms agreeability types.
 * @returns resolves to the terms agreeability types list.
 */
export const fetchAllTermsAgreeabilityTypes = async (): Promise<
    TermAgreeabilityType[]
> => {
    const result = await xhrGetAsync<TermAgreeabilityType[]>(
        `${EnvironmentConfig.API.V5}/terms/agreeability-types`,
    )
    return result
}

/**
 * Create a term.
 * @param data new term data.
 * @returns resolves to success or failure calling api.
 */
export const createTerm = async (
    data: Partial<FormAddTerm>,
): Promise<UserTerm> => {
    const result = await xhrPostAsync<Partial<FormAddTerm>, UserTerm>(
        `${EnvironmentConfig.API.V5}/terms`,
        data,
    )
    return result
}

/**
 * Edit a term.
 * @param termId term id.
 * @param data new term data.
 * @returns resolves to success or failure calling api.
 */
export const editTerm = async (
    termId: string,
    data: Partial<FormAddTerm>,
): Promise<UserTerm> => {
    const result = await xhrPutAsync<Partial<FormAddTerm>, UserTerm>(
        `${EnvironmentConfig.API.V5}/terms/${termId}`,
        data,
    )
    return result
}

/**
 * Fetch all terms users list.
 * @param termId the term id.
 * @param filter the filter.
 * @returns resolves to the terms users list.
 */
export const fetchAllTermsUsers = async (
    termId: string,
    filter?: string,
): Promise<
    PaginatedResponse<{
        result: number[]
    }>
> => {
    const result = await xhrGetPaginatedAsync<{
        result: number[]
    }>(`${EnvironmentConfig.API.V5}/terms/${termId}/users?${filter ?? ''}`)
    return result
}

/**
 * Add a term to the user.
 * @param termId the term id.
 * @param userId the user id.
 * @returns resolves to success or failure calling api.
 */
export const addUserTerm = async (
    termId: string,
    userId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrPostAsync<
        {
            userId: string
        },
        ApiV5ResponseSuccess
    >(`${EnvironmentConfig.API.V5}/terms/${termId}/users`, {
        userId,
    })
    return result
}

/**
 * Remove the user from term.
 * @param termId the term id.
 * @param userId the user id.
 * @returns resolves to success or failure calling api.
 */
export const removeTermUser = async (
    termId: string,
    userId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V5}/terms/${termId}/users/${userId}`,
    )
    return result
}

/**
 * Remove the term.
 * @param termId the term id.
 * @returns resolves to success or failure calling api.
 */
export const removeTerm = async (
    termId: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V5}/terms/${termId}`,
    )
    return result
}
