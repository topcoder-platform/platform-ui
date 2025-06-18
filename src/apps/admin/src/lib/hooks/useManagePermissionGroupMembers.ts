/**
 * Manage permission group members redux state
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'
import moment from 'moment'

import {
    FormGroupMembersFilters,
    UserGroup,
    UserGroupMember,
    UserIdType,
    UserInfo,
    UserMappingType,
} from '../models'
import { fetchGroupMembers, fetchGroups, removeGroupMember, searchUsers } from '../services'
import { handleError } from '../utils'

/// /////////////////
// Permission group members reducer
/// ////////////////

type GroupsState = {
    isLoading: boolean
    isFiltering: { [key: string]: boolean }
    isRemoving: { [key: string]: boolean }
    filteredGroupMembers: { [memberType: string]: UserGroupMember[] }
    allGroupMembers: { [memberType: string]: UserGroupMember[] }
}

const GroupsActionType = {
    FETCH_GROUP_MEMBERS_DONE: 'FETCH_GROUP_MEMBERS_DONE' as const,
    FETCH_GROUP_MEMBERS_FAILED: 'FETCH_GROUP_MEMBERS_FAILED' as const,
    FETCH_GROUP_MEMBERS_INIT: 'FETCH_GROUP_MEMBERS_INIT' as const,
    FILTER_GROUP_MEMBERS_DONE: 'FILTER_GROUP_MEMBERS_DONE' as const,
    FILTER_GROUP_MEMBERS_FAILED: 'FILTER_GROUP_MEMBERS_FAILED' as const,
    FILTER_GROUP_MEMBERS_INIT: 'FILTER_GROUP_MEMBERS_INIT' as const,
    REMOVE_GROUP_MEMBERS_DONE: 'REMOVE_GROUP_MEMBERS_DONE' as const,
    REMOVE_GROUP_MEMBERS_FAILED: 'REMOVE_GROUP_MEMBERS_FAILED' as const,
    REMOVE_GROUP_MEMBERS_INIT: 'REMOVE_GROUP_MEMBERS_INIT' as const,
}
// used to get all groups
const PAGE = 1
const PER_PAGE = 5000

type GroupsReducerAction =
    | {
          type:
              | typeof GroupsActionType.FETCH_GROUP_MEMBERS_INIT
              | typeof GroupsActionType.FETCH_GROUP_MEMBERS_FAILED
      }
    | {
          type:
              | typeof GroupsActionType.FILTER_GROUP_MEMBERS_INIT
              | typeof GroupsActionType.FILTER_GROUP_MEMBERS_FAILED
          payload: string
      }
    | {
          type: typeof GroupsActionType.FILTER_GROUP_MEMBERS_DONE
          payload: { memberType: string; datas: UserGroupMember[] }
      }
    | {
          type: typeof GroupsActionType.FETCH_GROUP_MEMBERS_DONE
          payload: { [memberType: string]: UserGroupMember[] }
      }
    | {
          type:
              | typeof GroupsActionType.REMOVE_GROUP_MEMBERS_DONE
              | typeof GroupsActionType.REMOVE_GROUP_MEMBERS_INIT
              | typeof GroupsActionType.REMOVE_GROUP_MEMBERS_FAILED
          payload: number
      }

const reducer = (
    previousState: GroupsState,
    action: GroupsReducerAction,
): GroupsState => {
    switch (action.type) {
        case GroupsActionType.FETCH_GROUP_MEMBERS_INIT: {
            return {
                ...previousState,
                allGroupMembers: {},
                filteredGroupMembers: {},
                isLoading: true,
            }
        }

        case GroupsActionType.FETCH_GROUP_MEMBERS_DONE: {
            return {
                ...previousState,
                allGroupMembers: action.payload,
                filteredGroupMembers: action.payload,
                isLoading: false,
            }
        }

        case GroupsActionType.FETCH_GROUP_MEMBERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        case GroupsActionType.FILTER_GROUP_MEMBERS_INIT: {
            return {
                ...previousState,
                isFiltering: {
                    ...previousState.isFiltering,
                    [action.payload]: true,
                },
            }
        }

        case GroupsActionType.FILTER_GROUP_MEMBERS_DONE: {
            return {
                ...previousState,
                filteredGroupMembers: {
                    ...previousState.filteredGroupMembers,
                    [action.payload.memberType]: action.payload.datas,
                },
                isFiltering: {
                    ...previousState.isFiltering,
                    [action.payload.memberType]: false,
                },
            }
        }

        case GroupsActionType.FILTER_GROUP_MEMBERS_FAILED: {
            return {
                ...previousState,
                isFiltering: {
                    ...previousState.isFiltering,
                    [action.payload]: false,
                },
            }
        }

        case GroupsActionType.REMOVE_GROUP_MEMBERS_INIT: {
            return {
                ...previousState,
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: true,
                },
            }
        }

        case GroupsActionType.REMOVE_GROUP_MEMBERS_DONE: {
            _.forOwn(previousState.allGroupMembers, (value, key) => {
                previousState.allGroupMembers[key] = _.filter(
                    previousState.allGroupMembers[key],
                    group => group.memberId !== action.payload,
                )
            })
            _.forOwn(previousState.filteredGroupMembers, (value, key) => {
                previousState.filteredGroupMembers[key] = _.filter(
                    previousState.filteredGroupMembers[key],
                    group => group.memberId !== action.payload,
                )
            })
            return {
                ...previousState,
                allGroupMembers: {
                    ...previousState.allGroupMembers,
                },
                filteredGroupMembers: {
                    ...previousState.filteredGroupMembers,
                },
                isRemoving: {
                    ...previousState.isRemoving,
                    [action.payload]: false,
                },
            }
        }

        case GroupsActionType.REMOVE_GROUP_MEMBERS_FAILED: {
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

/**
 * Find group id by its name
 *
 * This is helper function which return value in special shape
 * along with group ids array it return label defined by 'valueType'
 *
 * This function just retrieves all the groups and after resolves names by
 * searching in group list client side.
 * @param groupName group name
 * @param valueType label of the returned value
 * @returns resolved to object {value: <array of group ids>, type: valueType}
 */
async function getGroupIdsFilteredByName(groupName: string, valueType: string): Promise<{
    type: string;
    value: string[];
}> {
    const groupNameKey = groupName.toLowerCase()

    return fetchGroups({
        page: PAGE,
        perPage: PER_PAGE,
    })
        .then((groups: UserGroup[]) => {
            const filteredGroups = _.filter(
                groups,
                (group: UserGroup) => _.includes(group.name.toLowerCase(), groupNameKey),
            )

            return {
                type: valueType,
                value: _.map(filteredGroups, 'id'),
            }
        })
}

/**
 * Find user id by its handle
 *
 * This is helper function which return value in special shape
 * along with user ids array it return label defined by 'valueType'
 *
 * This function makes request for each user handle and saves resolved promise,
 * so second time server request is not being sent to the server for the same user handle.
 * @param userHandle user handle
 * @param valueType label of the returned value
 * @returns resolved to object {value: <array of user id>, type: valueType}
 */
async function getUserIdsFilteredByHandle(
    userHandle: string,
    valueType: string,
): Promise<{
    type: string;
    value: string[];
}> {
    return searchUsers({
        fields: 'id',
        filter: `handle=*${userHandle}*&like=true`,
        limit: 1000000, // set big limit to make sure server returns all records
    })
        .then((users: UserInfo[]) => _.map(users, 'id'))
        .then((userIds: string[]) => ({
            type: valueType,
            value: userIds,
        }))
}

/**
 * Helper function which performs all the requests to the server which are required to filter membership tables
 * @param filterCriteria filter criteria
 * @param memberType member type
 * @param filteredMembers list of membership to filter
 * @returns resolves to filtered membership list
 */
async function filterWithRequests(
    filterCriteria: FormGroupMembersFilters,
    memberType: string,
    filteredMembers: UserGroupMember[],
): Promise<UserGroupMember[]> {
    let filteredMembersResults = filteredMembers
    // list of all the server requests which we have to make to filter members
    const requests = []

    // as on client side we don't know user handles for member, createdBy, modifiedBy users
    // and we don't group names
    // to filter by them we have to get their according user ids and group ids
    // so we create requests to the server

    if (memberType === 'group' && filterCriteria.memberName) {
        requests.push(
            getGroupIdsFilteredByName(filterCriteria.memberName, 'memberName'),
        )
    }

    if (memberType === 'user' && filterCriteria.memberName) {
        requests.push(
            getUserIdsFilteredByHandle(filterCriteria.memberName, 'memberName'),
        )
    }

    if (filterCriteria.createdBy) {
        requests.push(
            getUserIdsFilteredByHandle(filterCriteria.createdBy, 'createdBy'),
        )
    }

    if (filterCriteria.modifiedBy) {
        requests.push(
            getUserIdsFilteredByHandle(filterCriteria.modifiedBy, 'modifiedBy'),
        )
    }

    // after we get all ids from the server we can filter data client side
    return Promise.all(requests)
        .then((ids: {
            type: string;
            value: string[];
        }[]) => {
            const idsObj: { [type: string]: string[] } = {}

            ids.forEach((result: {
                type: string;
                value: string[];
            }) => {
                idsObj[result.type] = result.value
            })

            // memberName
            if (filterCriteria.memberName) {
                if (!idsObj.memberName.length) {
                    filteredMembersResults = []
                } else {
                    filteredMembersResults = _.filter(
                        filteredMembersResults,
                        (membership: UserGroupMember) => _.includes(
                            idsObj.memberName,
                            membership.memberId.toString(),
                        ),
                    )
                }
            }

            // createdBy
            if (filterCriteria.createdBy) {
                if (!idsObj.createdBy) {
                    filteredMembersResults = []
                } else {
                    filteredMembersResults = _.filter(
                        filteredMembersResults,
                        (membership: UserGroupMember) => (
                            membership.createdBy
                            && _.includes(
                                idsObj.createdBy,
                                membership.createdBy.toString(),
                            )
                        ),
                    ) as UserGroupMember[]
                }
            }

            // modifiedBy
            if (filterCriteria.modifiedBy) {
                if (!idsObj.modifiedBy) {
                    filteredMembersResults = []
                } else {
                    filteredMembersResults = _.filter(
                        filteredMembersResults,
                        (membership: UserGroupMember) => (
                            !!membership.updatedBy
                            && _.includes(
                                idsObj.modifiedBy,
                                membership.updatedBy.toString(),
                            )
                        ),
                    ) as UserGroupMember[]
                }
            }

            return filteredMembersResults
        })
}

export interface useManagePermissionGroupMembersProps {
    isLoading: boolean
    isFiltering: { [key: string]: boolean }
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    groupMembers: { [memberType: string]: UserGroupMember[] }
    doFilterGroupMembers: (
        filterCriteria: FormGroupMembersFilters,
        memberType: string,
    ) => void
    doRemoveGroupMember: (memberId: number, memberType: string) => void
    doRemoveGroupMembers: (
        memberIds: number[],
        callBack: () => void,
    ) => void
}

/**
 * Manage permission group members redux state
 * @param groupId group id
 * @param loadUsers load list of users function
 * @param cancelLoadUser cancel load users
 * @param usersMapping mapping user id to user handle
 * @param loadGroups load list of group function
 * @param cancelLoadGroup cancel load groups
 * @param groupsMapping mapping group id to group name
 * @returns state data
 */
export function useManagePermissionGroupMembers(
    groupId: string,
    loadUser: (userId: UserIdType) => void,
    cancelLoadUser: () => void,
    usersMapping: UserMappingType, // from user id to user handle
    loadGroup: (userId: UserIdType) => void,
    cancelLoadGroup: () => void,
    groupsMapping: UserMappingType, // from group id to group name
): useManagePermissionGroupMembersProps {
    const memberTypes = useMemo(() => ['group', 'user'], [])
    const [state, dispatch] = useReducer(reducer, {
        allGroupMembers: {},
        filteredGroupMembers: {},
        isFiltering: {},
        isLoading: false,
        isRemoving: {},
    })
    const isLoadingRef = useRef(false)
    const isRemovingBool = useMemo(
        () => _.some(state.isRemoving, value => value === true),
        [state.isRemoving],
    )

    const doFetchGroup = useCallback(() => {
        dispatch({
            type: GroupsActionType.FETCH_GROUP_MEMBERS_INIT,
        })
        isLoadingRef.current = true
        fetchGroupMembers(groupId, { page: PAGE, perPage: PER_PAGE })
            .then(result => {
                isLoadingRef.current = false

                const data: { [memberType: string]: UserGroupMember[] } = {}
                _.forEach(memberTypes, memberType => {
                    data[memberType] = result.filter(
                        (membership: UserGroupMember) => membership.membershipType === memberType,
                    )
                    data[memberType].forEach((membership: UserGroupMember) => {
                        loadUser(membership.createdBy)
                        loadUser(membership.updatedBy)

                        if (memberType === 'user') {
                            // for user members load handles
                            loadUser(membership.memberId)
                        } else {
                            // for group members load names
                            loadGroup(membership.memberId)
                        }
                    })
                })

                dispatch({
                    payload: data,
                    type: GroupsActionType.FETCH_GROUP_MEMBERS_DONE,
                })
            })
            .catch(e => {
                isLoadingRef.current = false
                dispatch({
                    type: GroupsActionType.FETCH_GROUP_MEMBERS_FAILED,
                })
                handleError(e)
            })
    }, [dispatch, groupId, memberTypes, loadUser, loadGroup])

    const doFilterGroupMembers = useCallback(
        (filterCriteria: FormGroupMembersFilters, memberType: string) => {
            let filteredMembers = _.clone(state.allGroupMembers[memberType])

            // memberId
            if (filterCriteria.memberId) {
                filteredMembers = _.filter(
                    filteredMembers,
                    (membership: UserGroupMember) => (
                        `${membership.memberId}` === filterCriteria.memberId
                    ),
                )
            }

            // createdAtFrom
            if (filterCriteria.createdAtFrom) {
                const createdAtFrom = moment(filterCriteria.createdAtFrom)

                filteredMembers = _.filter(
                    filteredMembers,
                    (membership: UserGroupMember) => (
                        membership.createdAt
                        && createdAtFrom.isSameOrBefore(
                            membership.createdAt,
                            'day',
                        )
                    ),
                )
            }

            // createdAtTo
            if (filterCriteria.createdAtTo) {
                const createdAtTo = moment(filterCriteria.createdAtTo)

                filteredMembers = _.filter(
                    filteredMembers,
                    (membership: UserGroupMember) => (
                        membership.createdAt
                        && createdAtTo.isSameOrAfter(
                            membership.createdAt,
                            'day',
                        )
                    ),
                )
            }

            // modifiedAtFrom
            if (filterCriteria.modifiedAtFrom) {
                const modifiedAtFrom = moment(filterCriteria.modifiedAtFrom)

                filteredMembers = _.filter(
                    filteredMembers,
                    (membership: UserGroupMember) => (
                        membership.updatedAt
                        && modifiedAtFrom.isSameOrBefore(
                            membership.updatedAt,
                            'day',
                        )
                    ),
                )
            }

            // modifiedAtTo
            if (filterCriteria.modifiedAtTo) {
                const modifiedAtTo = moment(filterCriteria.modifiedAtTo)

                filteredMembers = _.filter(
                    filteredMembers,
                    (membership: UserGroupMember) => (
                        membership.updatedAt
                        && modifiedAtTo.isSameOrAfter(
                            membership.updatedAt,
                            'day',
                        )
                    ),
                )
            }

            if (
                filteredMembers.length > 0
                && (filterCriteria.memberName
                    || filterCriteria.createdBy
                    || filterCriteria.modifiedBy)
            ) {
                dispatch({
                    payload: memberType,
                    type: GroupsActionType.FILTER_GROUP_MEMBERS_INIT,
                })

                return filterWithRequests(
                    filterCriteria,
                    memberType,
                    filteredMembers,
                )
                    .then(datas => {
                        // after we filtered data we redraw table
                        dispatch({
                            payload: {
                                datas,
                                memberType,
                            },
                            type: GroupsActionType.FILTER_GROUP_MEMBERS_DONE,
                        })
                    })
                    .catch(error => {
                        dispatch({
                            payload: memberType,
                            type: GroupsActionType.FILTER_GROUP_MEMBERS_FAILED,
                        })
                        handleError(error)
                    })
            }

            dispatch({
                payload: {
                    datas: filteredMembers,
                    memberType,
                },
                type: GroupsActionType.FILTER_GROUP_MEMBERS_DONE,
            })
            return undefined
        },
        [dispatch, state.allGroupMembers],
    )

    const doRemoveGroupMember = useCallback(
        (memberId: number, memberType: string) => {
            dispatch({
                payload: memberId,
                type: GroupsActionType.REMOVE_GROUP_MEMBERS_INIT,
            })
            removeGroupMember(groupId, memberId)
                .then(() => {
                    if (memberType === 'group') {
                        toast.success('Group removed successfully', {
                            toastId: 'Remove group member',
                        })
                    } else {
                        toast.success('Member removed successfully', {
                            toastId: 'Remove group member',
                        })
                    }

                    dispatch({
                        payload: memberId,
                        type: GroupsActionType.REMOVE_GROUP_MEMBERS_DONE,
                    })
                })
                .catch(e => {
                    dispatch({
                        payload: memberId,
                        type: GroupsActionType.REMOVE_GROUP_MEMBERS_FAILED,
                    })
                    handleError(e)
                })
        },
        [dispatch, groupId],
    )

    const doRemoveGroupMembers = useCallback(
        (memberIds: number[], callBack: () => void) => {
            let hasSubmissionErrors = false
            _.forEach(memberIds, groupMemberId => {
                dispatch({
                    payload: groupMemberId,
                    type: GroupsActionType.REMOVE_GROUP_MEMBERS_INIT,
                })
            })
            Promise.all(
                memberIds.map(async groupMemberId => removeGroupMember(groupId, groupMemberId)
                    .catch(e => {
                        hasSubmissionErrors = true
                        handleError(e)
                    })),
            )
                .then(() => {
                    if (!hasSubmissionErrors) {
                        toast.success(
                            `${
                                memberIds.length > 1 ? 'Members' : 'Member'
                            } removed successfully`,
                            {
                                toastId: 'Remove members',
                            },
                        )
                        callBack()
                    }

                    _.forEach(memberIds, groupMemberId => {
                        dispatch({
                            payload: groupMemberId,
                            type: GroupsActionType.REMOVE_GROUP_MEMBERS_DONE,
                        })
                    })
                })
                .catch(e => {
                    _.forEach(memberIds, groupMemberId => {
                        dispatch({
                            payload: groupMemberId,
                            type: GroupsActionType.REMOVE_GROUP_MEMBERS_FAILED,
                        })
                    })
                    handleError(e)
                })
        },
        [dispatch, groupId],
    )

    useEffect(() => {
        if (!isLoadingRef.current && groupId) {
            doFetchGroup()
        }
    }, [groupId, doFetchGroup])

    useEffect(() => () => {
        // clear queue of currently loading user handles after exit ui
        cancelLoadUser()
        // clear queue of currently loading group handles after exit ui
        cancelLoadGroup()
    }, [cancelLoadUser, cancelLoadGroup])

    useEffect(() => {
        _.forEach(memberTypes, memberType => {
            const datas = state.allGroupMembers[memberType] || []
            datas.forEach((membership: UserGroupMember) => {
                membership.createdByHandle = usersMapping[membership.createdBy]
                membership.updatedByHandle = usersMapping[membership.updatedBy]

                if (memberType === 'user') {
                    membership.name = usersMapping[membership.memberId]
                } else {
                    membership.name = groupsMapping[membership.memberId]
                }
            })
        })
    }, [usersMapping, groupsMapping, state.allGroupMembers, memberTypes])

    return {
        doFilterGroupMembers,
        doRemoveGroupMember,
        doRemoveGroupMembers,
        groupMembers: state.filteredGroupMembers,
        isFiltering: state.isFiltering,
        isLoading: state.isLoading,
        isRemoving: state.isRemoving,
        isRemovingBool,
    }
}
