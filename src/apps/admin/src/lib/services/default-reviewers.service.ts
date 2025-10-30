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
    DefaultChallengeReviewer,
    FormAddDefaultReviewer,
} from '../models'

export type DefaultReviewersResponsePayload =
    | DefaultChallengeReviewer[]
    | {
        result: DefaultChallengeReviewer[]
    }

export const fetchAllDefaultReviewers = async (
    filter: string,
): Promise<PaginatedResponse<DefaultReviewersResponsePayload>> => xhrGetPaginatedAsync<
    DefaultReviewersResponsePayload
>(`${EnvironmentConfig.API.V6}/default-challenge-reviewers?${filter}`)

export const getDefaultReviewerById = async (
    id: string,
): Promise<DefaultChallengeReviewer> => {
    const result = await xhrGetAsync<DefaultChallengeReviewer>(
        `${EnvironmentConfig.API.V6}/default-challenge-reviewers/${id}`,
    )
    return result
}

export const createDefaultReviewer = async (
    data: Partial<FormAddDefaultReviewer>,
): Promise<DefaultChallengeReviewer> => {
    const result = await xhrPostAsync<
        Partial<FormAddDefaultReviewer>,
        DefaultChallengeReviewer
    >(`${EnvironmentConfig.API.V6}/default-challenge-reviewers`, data)
    return result
}

export const updateDefaultReviewer = async (
    id: string,
    data: Partial<FormAddDefaultReviewer>,
): Promise<DefaultChallengeReviewer> => {
    const result = await xhrPutAsync<
        Partial<FormAddDefaultReviewer>,
        DefaultChallengeReviewer
    >(`${EnvironmentConfig.API.V6}/default-challenge-reviewers/${id}`, data)
    return result
}

export const deleteDefaultReviewer = async (
    id: string,
): Promise<ApiV5ResponseSuccess> => {
    const result = await xhrDeleteAsync<ApiV5ResponseSuccess>(
        `${EnvironmentConfig.API.V6}/default-challenge-reviewers/${id}`,
    )
    return result
}
