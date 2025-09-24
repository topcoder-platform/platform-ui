/**
 * Manage add/edit client redux state
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'

import { handleError } from '../utils'
import { ClientInfo, FormEditClient } from '../models'
import { createClient, editClient, findClientById } from '../services'

/// /////////////////
// Add/Edit client reducer
/// ////////////////

type ClientsState = {
    isLoading: boolean
    isAdding: boolean
    isUpdating: boolean
    clientInfo?: ClientInfo
}

const ClientsActionType = {
    ADD_CLIENT_DONE: 'ADD_CLIENT_DONE' as const,
    ADD_CLIENT_FAILED: 'ADD_CLIENT_FAILED' as const,
    ADD_CLIENT_INIT: 'ADD_CLIENT_INIT' as const,
    FETCH_CLIENT_DONE: 'FETCH_CLIENT_DONE' as const,
    FETCH_CLIENT_FAILED: 'FETCH_CLIENT_FAILED' as const,
    FETCH_CLIENT_INIT: 'FETCH_CLIENT_INIT' as const,
    UPDATE_CLIENT_DONE: 'UPDATE_CLIENT_DONE' as const,
    UPDATE_CLIENT_FAILED: 'UPDATE_CLIENT_FAILED' as const,
    UPDATE_CLIENT_INIT: 'UPDATE_CLIENT_INIT' as const,
}

type ClientsReducerAction =
    | {
          type:
              | typeof ClientsActionType.ADD_CLIENT_DONE
              | typeof ClientsActionType.ADD_CLIENT_INIT
              | typeof ClientsActionType.ADD_CLIENT_FAILED
              | typeof ClientsActionType.FETCH_CLIENT_INIT
              | typeof ClientsActionType.FETCH_CLIENT_FAILED
              | typeof ClientsActionType.UPDATE_CLIENT_DONE
              | typeof ClientsActionType.UPDATE_CLIENT_INIT
              | typeof ClientsActionType.UPDATE_CLIENT_FAILED
      }
    | {
          type: typeof ClientsActionType.FETCH_CLIENT_DONE
          payload: ClientInfo
      }

const reducer = (
    previousState: ClientsState,
    action: ClientsReducerAction,
): ClientsState => {
    switch (action.type) {
        case ClientsActionType.FETCH_CLIENT_INIT: {
            return {
                ...previousState,
                isLoading: true,
            }
        }

        case ClientsActionType.FETCH_CLIENT_DONE: {
            const clientInfo = action.payload
            return {
                ...previousState,
                clientInfo,
                isLoading: false,
            }
        }

        case ClientsActionType.FETCH_CLIENT_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case ClientsActionType.ADD_CLIENT_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case ClientsActionType.ADD_CLIENT_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case ClientsActionType.ADD_CLIENT_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case ClientsActionType.UPDATE_CLIENT_INIT: {
            return {
                ...previousState,
                isUpdating: true,
            }
        }

        case ClientsActionType.UPDATE_CLIENT_DONE: {
            return {
                ...previousState,
                isUpdating: false,
            }
        }

        case ClientsActionType.UPDATE_CLIENT_FAILED: {
            return {
                ...previousState,
                isUpdating: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageAddClientProps {
    isLoading: boolean
    isAdding: boolean
    isUpdating: boolean
    clientInfo?: ClientInfo
    doAddClientInfo: (data: FormEditClient, callBack: () => void) => void
    doUpdateClientInfo: (data: FormEditClient, callBack: () => void) => void
}

/**
 * Manage add/edit client redux state
 * @param clientId account id
 * @returns state data
 */
export function useManageAddClient(clientId: string): useManageAddClientProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
        isLoading: false,
        isUpdating: false,
    })
    const isLoadingRef = useRef(false)

    const doFetchClientInfo = useCallback(() => {
        if (isLoadingRef.current) {
            return
        }

        dispatch({
            type: ClientsActionType.FETCH_CLIENT_INIT,
        })
        isLoadingRef.current = true
        function handleErrorResult(e: any): void {
            dispatch({
                type: ClientsActionType.FETCH_CLIENT_FAILED,
            })
            handleError(e)
            isLoadingRef.current = false
        }

        function handleSuccessResult(result: ClientInfo): void {
            dispatch({
                payload: result,
                type: ClientsActionType.FETCH_CLIENT_DONE,
            })
            isLoadingRef.current = false
        }

        findClientById(clientId)
            .then(result => {
                handleSuccessResult(result)
            })
            .catch(handleErrorResult)
    }, [dispatch, clientId])

    const doAddClientInfo = useCallback(
        (data: FormEditClient, callBack: () => void) => {
            dispatch({
                type: ClientsActionType.ADD_CLIENT_INIT,
            })
            createClient(data)
                .then(() => {
                    toast.success('Client added successfully', {
                        toastId: 'Add client',
                    })
                    dispatch({
                        type: ClientsActionType.ADD_CLIENT_DONE,
                    })
                    callBack()
                })
                .catch(e => {
                    dispatch({
                        type: ClientsActionType.ADD_CLIENT_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch],
    )

    const doUpdateClientInfo = useCallback(
        (data: FormEditClient, callBack: () => void) => {
            dispatch({
                type: ClientsActionType.UPDATE_CLIENT_INIT,
            })
            editClient(clientId, data)
                .then(() => {
                    toast.success('Client updated successfully', {
                        toastId: 'Update client',
                    })
                    dispatch({
                        type: ClientsActionType.UPDATE_CLIENT_DONE,
                    })
                    callBack()
                })
                .catch(e => {
                    dispatch({
                        type: ClientsActionType.UPDATE_CLIENT_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, clientId],
    )

    useEffect(() => {
        if (clientId) {
            doFetchClientInfo()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId])

    return {
        clientInfo: state.clientInfo,
        doAddClientInfo,
        doUpdateClientInfo,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        isUpdating: state.isUpdating,
    }
}
