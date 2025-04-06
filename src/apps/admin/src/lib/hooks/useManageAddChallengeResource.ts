/**
 * Manage Add Challenge Resource
 */
import { useCallback, useReducer } from 'react'
import { toast } from 'react-toastify'

import { FormAddResource, UserInfo } from '../models'
import { addChallengeResource } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Add challenge resource reducer
/// ////////////////

type AddChallengeResourceState = {
    isAdding: boolean
    userInfo?: UserInfo
}

const AddChallengeResourceActionType = {
    ADD_CHALLENGE_RESOURCE_DONE: 'ADD_CHALLENGE_RESOURCE_DONE' as const,
    ADD_CHALLENGE_RESOURCE_FAILED: 'ADD_CHALLENGE_RESOURCE_FAILED' as const,
    ADD_CHALLENGE_RESOURCE_INIT: 'ADD_CHALLENGE_RESOURCE_INIT' as const,
}

type AddChallengeResourceReducerAction = {
    type:
        | typeof AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_DONE
        | typeof AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_INIT
        | typeof AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_FAILED
}

const reducer = (
    previousState: AddChallengeResourceState,
    action: AddChallengeResourceReducerAction,
): AddChallengeResourceState => {
    switch (action.type) {
        case AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_INIT: {
            return {
                ...previousState,
                isAdding: true,
            }
        }

        case AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_DONE: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        case AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_FAILED: {
            return {
                ...previousState,
                isAdding: false,
            }
        }

        default: {
            return previousState
        }
    }
}

export interface useManageAddChallengeResourceProps {
    isAdding: boolean
    doAddChallengeResource: (
        data: FormAddResource,
        callBack: () => void,
    ) => void
}

/**
 * Manage add challenge resource redux state
 * @param challengeId challenge id
 * @returns state data
 */
export function useManageAddChallengeResource(
    challengeId: string,
): useManageAddChallengeResourceProps {
    const [state, dispatch] = useReducer(reducer, {
        isAdding: false,
    })

    const doAddChallengeResource = useCallback(
        (data: FormAddResource, callBack: () => void) => {
            dispatch({
                type: AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_INIT,
            })
            addChallengeResource({
                challengeId,
                memberHandle: data.handle.label as string,
                roleId: data.resourceRole.value as string,
            })
                .then(() => {
                    toast.success('Challenge resource added successfully', {
                        toastId: 'Add challenge resource',
                    })
                    dispatch({
                        type: AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_DONE,
                    })
                    callBack()
                })
                .catch(e => {
                    dispatch({
                        type: AddChallengeResourceActionType.ADD_CHALLENGE_RESOURCE_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, challengeId],
    )

    return {
        doAddChallengeResource,
        isAdding: state.isAdding,
    }
}
