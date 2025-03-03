/**
 * Manage user achievements redux state
 */
import { useCallback, useReducer } from 'react'

import { UserInfo, UserStatusHistory } from '../models'
import { fetchAchievements } from '../services'
import { handleError } from '../utils'

import { useOnComponentDidMount } from './useOnComponentDidMount'

/// /////////////////
// User achievements reducer
/// ////////////////

type UserStatusHistorysState = {
    isLoading: boolean
    userAchievements: UserStatusHistory[]
}

const UserStatusHistorysActionType = {
    FETCH_USER_ACHIEVEMENTS_DONE: 'FETCH_USER_ACHIEVEMENTS_DONE' as const,
    FETCH_USER_ACHIEVEMENTS_FAILED: 'FETCH_USER_ACHIEVEMENTS_FAILED' as const,
    FETCH_USER_ACHIEVEMENTS_INIT: 'FETCH_USER_ACHIEVEMENTS_INIT' as const,
}

type UserStatusHistorysReducerAction =
    | {
          type:
              | typeof UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_INIT
              | typeof UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_FAILED
      }
    | {
          type: typeof UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_DONE
          payload: UserStatusHistory[]
      }

const reducer = (
    previousState: UserStatusHistorysState,
    action: UserStatusHistorysReducerAction,
): UserStatusHistorysState => {
    switch (action.type) {
        case UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_INIT: {
            return {
                ...previousState,
                isLoading: true,
                userAchievements: [],
            }
        }

        case UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_DONE: {
            return {
                ...previousState,
                isLoading: false,
                userAchievements: action.payload,
            }
        }

        case UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageUserAchievementsProps {
    isLoading: boolean
    userAchievements: UserStatusHistory[]
}

/**
 * Manage user achievements redux state
 * @param userInfo user info
 * @returns state data
 */
export function useManageUserAchievements(
    userInfo: UserInfo,
): useManageUserAchievementsProps {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        userAchievements: [],
    })

    const doFetchUserStatusHistorys = useCallback(() => {
        dispatch({
            type: UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_INIT,
        })
        fetchAchievements(userInfo.id)
            .then(result => {
                dispatch({
                    payload: result,
                    type: UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_DONE,
                })
            })
            .catch(e => {
                dispatch({
                    type: UserStatusHistorysActionType.FETCH_USER_ACHIEVEMENTS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, userInfo])

    useOnComponentDidMount(() => {
        doFetchUserStatusHistorys()
    })

    return {
        isLoading: state.isLoading,
        userAchievements: state.userAchievements,
    }
}
