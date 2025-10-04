/**
 * Manage billing account resources redux state
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { BillingAccountResource, UserInfo } from '../models'
import {
    deleteBillingAccountResource,
    findAllBillingAccountResources,
    searchUsers,
} from '../services'
import { findUserById } from '../services/user.service'
import { handleError } from '../utils'

/// /////////////////
// Permission billing account resources reducer
/// ////////////////

type BillingAccountResourcesState = {
    isLoading: boolean
    isRemoving: { [key: string]: boolean }
    billingAccountResources: BillingAccountResource[]
}

const BillingAccountResourcesActionType = {
    FETCH_BILLING_ACCOUNT_RESOURCES_DONE:
        'FETCH_BILLING_ACCOUNT_RESOURCES_DONE' as const,
    FETCH_BILLING_ACCOUNT_RESOURCES_FAILED:
        'FETCH_BILLING_ACCOUNT_RESOURCES_FAILED' as const,
    FETCH_BILLING_ACCOUNT_RESOURCES_INIT:
        'FETCH_BILLING_ACCOUNT_RESOURCES_INIT' as const,
    REMOVE_BILLING_ACCOUNT_RESOURCES_DONE:
        'REMOVE_BILLING_ACCOUNT_RESOURCES_DONE' as const,
    REMOVE_BILLING_ACCOUNT_RESOURCES_FAILED:
        'REMOVE_BILLING_ACCOUNT_RESOURCES_FAILED' as const,
    REMOVE_BILLING_ACCOUNT_RESOURCES_INIT:
        'REMOVE_BILLING_ACCOUNT_RESOURCES_INIT' as const,
}

type BillingAccountResourcesReducerAction =
    | {
          type:
              | typeof BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_INIT
              | typeof BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_FAILED
      }
    | {
          type: typeof BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_DONE
          payload: BillingAccountResource[]
      }
    | {
          type:
              | typeof BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_DONE
              | typeof BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_INIT
              | typeof BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_FAILED
          payload: number
      }

const reducer = (
    previousState: BillingAccountResourcesState,
    action: BillingAccountResourcesReducerAction,
): BillingAccountResourcesState => {
    switch (action.type) {
        case BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_INIT: {
            return {
                ...previousState,
                billingAccountResources: [],
                isLoading: true,
            }
        }

        case BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_DONE: {
            return {
                ...previousState,
                billingAccountResources: action.payload,
                isLoading: false,
            }
        }

        case BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_DONE: {
            const billingAccountResources = _.filter(
                previousState.billingAccountResources,
                role => role.id !== action.payload,
            )
            return {
                ...previousState,
                billingAccountResources,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        case BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_FAILED: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageBillingAccountResourcesProps {
    isLoading: boolean
    isRemoving: { [key: string]: boolean }
    isRemovingBool: boolean
    billingAccountResources: BillingAccountResource[]
    doRemoveBillingAccountResource: (data: BillingAccountResource) => void
    refresh: () => void
}

/**
 * Manage billing account resources redux state
 * @param accountId billing account id
 * @returns state data
 */
export function useManageBillingAccountResources(
    accountId: string,
): useManageBillingAccountResourcesProps {
    const [state, dispatch] = useReducer(reducer, {
        billingAccountResources: [],
        isLoading: false,
        isRemoving: {},
    })
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )
    const isLoadingRef = useRef(false)

    const doFetchBillingAccountResource = useCallback(() => {
        if (isLoadingRef.current) {
            return
        }

        dispatch({
            type: BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_INIT,
        })
        isLoadingRef.current = true
        findAllBillingAccountResources(accountId)
            .then(async result => {
                // Map any numeric "name" values (user IDs) to member handles
                const mapped: BillingAccountResource[] = await Promise.all(
                    (result || []).map(async r => {
                        const isNumericId = /^\d+$/.test(r.name)
                        if (!isNumericId) return r
                        try {
                            const user = await findUserById(r.name)
                            if (user && user.handle) {
                                return { ...r, name: user.handle }
                            }
                        } catch {
                            // ignore and fall back to original value
                        }

                        return r
                    }),
                )
                isLoadingRef.current = false
                dispatch({
                    payload: mapped,
                    type: BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_DONE,
                })
            })
            .catch(e => {
                isLoadingRef.current = false
                dispatch({
                    type: BillingAccountResourcesActionType.FETCH_BILLING_ACCOUNT_RESOURCES_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, accountId])

    const doRemoveBillingAccountResource = useCallback(
        (item: BillingAccountResource) => {
            dispatch({
                payload: item.id,
                type: BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_INIT,
            })
            function handleActionError(error: any): void {
                dispatch({
                    payload: item.id,
                    type: BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_FAILED,
                })
                handleError(error)
            }

            const numericId = /^\d+$/.test(item.name) ? item.name : undefined
            if (numericId) {
                // If the table value is a userId, delete directly by userId
                deleteBillingAccountResource(accountId, numericId)
                    .then(() => {
                        toast.success('Billing account resource removed successfully', {
                            toastId: 'Remove billing account resource',
                        })
                        dispatch({
                            payload: item.id,
                            type: BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_DONE,
                        })
                    })
                    .catch(handleActionError)
                return
            }

            searchUsers({
                filter: `handle=${item.name}`,
            })
                .then((userInfos: UserInfo[]) => {
                    if (userInfos && userInfos.length) {
                        deleteBillingAccountResource(accountId, userInfos[0].id)
                            .then(() => {
                                toast.success(
                                    'Billing account resource removed successfully',
                                    {
                                        toastId:
                                            'Remove billing account resource',
                                    },
                                )
                                dispatch({
                                    payload: item.id,
                                    type: BillingAccountResourcesActionType.REMOVE_BILLING_ACCOUNT_RESOURCES_DONE,
                                })
                            })
                            .catch(handleActionError)
                    } else {
                        handleActionError({
                            message: 'Billing account resource removed failed.',
                        })
                    }
                })
                .catch(handleActionError)
        },
        [dispatch, accountId],
    )

    useEffect(() => {
        if (!isLoadingRef.current) {
            doFetchBillingAccountResource()
        }
    }, [accountId, doFetchBillingAccountResource])

    return {
        billingAccountResources: state.billingAccountResources,
        doRemoveBillingAccountResource,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        isRemovingBool,
        refresh: () => {
            if (!isLoadingRef.current) {
                doFetchBillingAccountResource()
            }
        },
    }
}
