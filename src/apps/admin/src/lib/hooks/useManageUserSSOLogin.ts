/**
 * Manage sso user logins redux state
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { FormAddSSOLoginData } from '../models/FormAddSSOLoginData.model'
import { SSOUserLogin, UserInfo } from '../models'
import { createSSOUserLogin, deleteSSOUserLogin, fetchSSOUserLogins, updateSSOUserLogin } from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// SSO user logins reducer
/// ////////////////

type SSOUserLoginsState = {
    isLoading: boolean
    isAdding: boolean
    ssoUserLogins: SSOUserLogin[]
    isRemoving: { [key: string]: boolean }
}

const SSOUserLoginsActionType = {
    ADD_SSO_USER_LOGIN_DONE: 'ADD_SSO_USER_LOGIN_DONE' as const,
    ADD_SSO_USER_LOGIN_FAILED: 'ADD_SSO_USER_LOGIN_FAILED' as const,
    ADD_SSO_USER_LOGIN_INIT: 'ADD_SSO_USER_LOGIN_INIT' as const,
    FETCH_SSO_USER_LOGINS_DONE: 'FETCH_SSO_USER_LOGINS_DONE' as const,
    FETCH_SSO_USER_LOGINS_FAILED: 'FETCH_SSO_USER_LOGINS_FAILED' as const,
    FETCH_SSO_USER_LOGINS_INIT: 'FETCH_SSO_USER_LOGINS_INIT' as const,
    REMOVE_SSO_USER_LOGIN_DONE: 'REMOVE_SSO_USER_LOGIN_DONE' as const,
    REMOVE_SSO_USER_LOGIN_FAILED: 'REMOVE_SSO_USER_LOGIN_FAILED' as const,
    REMOVE_SSO_USER_LOGIN_INIT: 'REMOVE_SSO_USER_LOGIN_INIT' as const,
    UPDATE_SSO_USER_LOGIN_DONE: 'UPDATE_SSO_USER_LOGIN_DONE' as const,
    UPDATE_SSO_USER_LOGIN_FAILED: 'UPDATE_SSO_USER_LOGIN_FAILED' as const,
    UPDATE_SSO_USER_LOGIN_INIT: 'UPDATE_SSO_USER_LOGIN_INIT' as const,
}

type SSOUserLoginsReducerAction =
    | {
          type:
              | typeof SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_INIT
              | typeof SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_FAILED
              | typeof SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_INIT
              | typeof SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_FAILED
              | typeof SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_INIT
              | typeof SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_FAILED
      }
    | {
          type: typeof SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_DONE
          payload: {
              ssoUserLogins: SSOUserLogin[]
          }
      }
    | {
          type:
              | typeof SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_DONE
              | typeof SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_DONE
          payload: SSOUserLogin
      }
    | {
          type:
              | typeof SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_DONE
              | typeof SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_INIT
              | typeof SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_FAILED
          payload: string
      }

const reducer = (
    previousState: SSOUserLoginsState,
    action: SSOUserLoginsReducerAction,
): SSOUserLoginsState => {
    switch (action.type) {
        case SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_INIT: {
            return {
                ...previousState,
                isLoading: true,
                ssoUserLogins: [],
            }
        }

        case SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_DONE: {
            return {
                ...previousState,
                isLoading: false,
                ssoUserLogins: action.payload.ssoUserLogins,
            }
        }

        case SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_DONE: {
            return {
                ...previousState,
                isAdding: false,
                ssoUserLogins: [...previousState.ssoUserLogins, action.payload],
            }
        }

        case SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_DONE: {
            return {
                ...previousState,
                isAdding: false,
                ssoUserLogins: previousState.ssoUserLogins.map(
                    item => (item.provider === action.payload.provider
                        ? action.payload
                        : item),
                ),
            }
        }

        case SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_DONE: {
            const ssoUserLogins = _.filter(
                previousState.ssoUserLogins,
                item => item.provider !== action.payload,
            )
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
                ssoUserLogins,
            }
        }

        case SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_FAILED: {
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

export interface useManageUserSSOLoginProps {
    isLoading: boolean
    isRemoving: { [key: string]: boolean }
    isAdding: boolean
    ssoUserLogins: SSOUserLogin[]
    doAddSSOUserLogin: (
        formData: FormAddSSOLoginData,
        onSuccess: () => void,
    ) => void
    doUpdateSSOUserLogin: (
        formData: FormAddSSOLoginData,
        onSuccess: () => void,
    ) => void
    doRemoveSSOUserLogin: (ssoUserLogin: SSOUserLogin) => void
}

/**
 * Manage sso user logins redux state
 * @param userInfo user info
 * @returns state data
 */
export function useManageUserSSOLogin(
    userInfo: UserInfo,
): useManageUserSSOLoginProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
        isLoading: false,
        isRemoving: {},
        ssoUserLogins: [],
    })

    const doFetchSSOUserLogins = useCallback(() => {
        dispatch({
            type: SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_INIT,
        })
        fetchSSOUserLogins(userInfo.id)
            .then(result => {
                dispatch({
                    payload: {
                        ssoUserLogins: result,
                    },
                    type: SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_DONE,
                })
            })
            .catch(e => {
                dispatch({
                    type: SSOUserLoginsActionType.FETCH_SSO_USER_LOGINS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, userInfo])

    const doAddSSOUserLogin = useCallback(
        (formData: FormAddSSOLoginData, onSuccess: () => void) => {
            dispatch({
                type: SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_INIT,
            })
            createSSOUserLogin(userInfo.id, formData)
                .then(result => {
                    toast.success('SSO login added successfully', {
                        toastId: 'Add sso login',
                    })
                    dispatch({
                        payload: result,
                        type: SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_DONE,
                    })
                    onSuccess()
                })
                .catch(e => {
                    dispatch({
                        type: SSOUserLoginsActionType.ADD_SSO_USER_LOGIN_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    const doUpdateSSOUserLogin = useCallback(
        (formData: FormAddSSOLoginData, onSuccess: () => void) => {
            dispatch({
                type: SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_INIT,
            })
            updateSSOUserLogin(userInfo.id, formData)
                .then(result => {
                    toast.success('SSO login updated successfully', {
                        toastId: 'Update sso login',
                    })
                    dispatch({
                        payload: result,
                        type: SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_DONE,
                    })
                    onSuccess()
                })
                .catch(e => {
                    dispatch({
                        type: SSOUserLoginsActionType.UPDATE_SSO_USER_LOGIN_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    const doRemoveSSOUserLogin = useCallback(
        (ssoUserLogin: SSOUserLogin) => {
            dispatch({
                payload: ssoUserLogin.provider,
                type: SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_INIT,
            })
            deleteSSOUserLogin(userInfo.id, ssoUserLogin.provider)
                .then(() => {
                    toast.success('SSO login removed successfully', {
                        toastId: 'Remove sso login',
                    })
                    dispatch({
                        payload: ssoUserLogin.provider,
                        type: SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        payload: ssoUserLogin.provider,
                        type: SSOUserLoginsActionType.REMOVE_SSO_USER_LOGIN_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, userInfo],
    )

    useOnComponentDidMount(() => {
        doFetchSSOUserLogins()
    })

    return {
        doAddSSOUserLogin,
        doRemoveSSOUserLogin,
        doUpdateSSOUserLogin,
        isAdding: state.isAdding,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        ssoUserLogins: state.ssoUserLogins,
    }
}
