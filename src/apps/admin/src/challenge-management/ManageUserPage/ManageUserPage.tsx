import {
    Dispatch,
    FC,
    SetStateAction,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { PlusIcon } from '@heroicons/react/solid'
import { PaginatedResponse } from '~/libs/core'
import {
    Button,
    LinkButton,
    LoadingSpinner,
    PageDivider,
    PageTitle,
} from '~/libs/ui'

import {
    ChallengeAddUserDialog,
    ChallengeUserFilters,
    ChallengeUserList,
    Display,
    PageContent,
    PageHeader,
} from '../../lib/components'
import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import {
    ChallengeFilterCriteria,
    ChallengeResource,
    ChallengeResourceFilterCriteria,
} from '../../lib/models'
import {
    addChallengeResource,
    deleteChallengeResource,
    getChallengeByLegacyId,
    getChallengeResources,
} from '../../lib/services'
import { createChallengeQueryString, handleError } from '../../lib/utils'
import { useEventCallback, useFetchChallenge } from '../../lib/hooks'
import { rootRoute } from '../../config/routes.config'

import styles from './ManageUserPage.module.scss'

const BackToChallengeListButton: FC = () => {
    const location = useLocation()
    const routeState: { previousChallengeListFilter: ChallengeFilterCriteria }
        = location.state || {}
    const qs = routeState.previousChallengeListFilter
        ? `?${createChallengeQueryString(routeState.previousChallengeListFilter)}`
        : ''
    return (
        <LinkButton
            primary
            light
            to={`${rootRoute}/challenge-management${qs}`}
            size='lg'
        >
            Back
        </LinkButton>
    )
}

/**
 * Manage Users page.
 */
export const ManageUserPage: FC = () => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
    const { challengeInfo } = useFetchChallenge(challengeId)
    const pageTitle = challengeInfo?.name
        ? `Manage users for ${challengeInfo.name}`
        : 'Manage Users'
    const [filterCriteria, setFilterCriteria]: [
        ChallengeResourceFilterCriteria,
        Dispatch<SetStateAction<ChallengeResourceFilterCriteria>>,
    ] = useState<ChallengeResourceFilterCriteria>({
        page: 1,
        perPage: TABLE_PAGINATION_ITEM_PER_PAGE,
        roleId: '',
    })
    const [users, setUsers]: [
        Array<ChallengeResource>,
        Dispatch<SetStateAction<Array<ChallengeResource>>>,
    ] = useState<Array<ChallengeResource>>([])
    const {
        filter: doFilter,
        filtering,
        filtered,
        totalUsers,
    }: ReturnType<typeof useFilter> = useFilter({ challengeId, filterCriteria })
    const { remove: doRemove, removing }: ReturnType<typeof useRemove>
        = useRemove({ challengeId })
    const [openAddUserDialog, setOpenAddUserDialog] = useState(false)

    const filter = useEventCallback((): void => {
        doFilter()
            .then(data => {
                setUsers(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    const remove = useEventCallback(
        (usersToRemove: Array<ChallengeResource>): void => {
            // eslint-disable-next-line max-len
            const removeUser = (user: ChallengeResource): void => setUsers(oldUsers => oldUsers.filter(i => i.id !== user.id))

            if (usersToRemove.length === 1) {
                doRemove(usersToRemove[0])
                    .then(() => removeUser(usersToRemove[0]))
            } else {
                Promise.all(
                    usersToRemove.map(usr => doRemove(usr)
                        .then(() => removeUser(usr))),
                )
            }
        },
    )

    const add = useEventCallback(
        async ({ handles, roleId }: { handles: string[]; roleId: string }) => {
            let successCount = 0
            await Promise.all(
                handles.map(handle => addChallengeResource({
                    challengeId,
                    memberHandle: handle,
                    roleId,
                })
                    .then(() => {
                        successCount += 1
                    })
                    .catch(handleError)),
            )
            if (successCount) {
                const msg
                    = successCount > 1
                        ? `${successCount} users have been added.`
                        : 'User has been added.'
                toast.success(msg)
                if (
                    !filterCriteria.roleId
                    || filterCriteria.roleId === roleId
                ) {
                    filter()
                }
            }
        },
    )

    // Init
    const [filtersInited, setFiltersInited] = useState(false)
    useEffect(() => {
        if (filtersInited) {
            filter()
        }
    }, [filtersInited]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: filter

    // Page change
    const [pageChangeEvent, setPageChangeEvent] = useState(false)
    const previousPageChangeEvent = useRef(false)
    useEffect(() => {
        if (pageChangeEvent) {
            filter()
            setPageChangeEvent(false)
            previousPageChangeEvent.current = true
        }
    }, [pageChangeEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: filter

    // Reset
    const [resetEvent, setResetEvent] = useState(false)
    useEffect(() => {
        if (resetEvent) {
            filter()
            setResetEvent(false)
        }
    }, [resetEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: filter

    const handleOpenAddUserDialog = useEventCallback(() => setOpenAddUserDialog(true))
    const handleReset = useEventCallback(() => {
        previousPageChangeEvent.current = false
        setResetEvent(true)
    })
    const handlePageChange = useEventCallback((page: number) => {
        setFilterCriteria({ ...filterCriteria, page })
        setPageChangeEvent(true)
    })
    const handleFilterIntialize = useEventCallback(() => {
        setFiltersInited(true)
    })

    return (
        <>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <Button primary onClick={handleOpenAddUserDialog} size='lg'>
                        <PlusIcon className='icon icon-fill' />
                        {' '}
                        Add User
                    </Button>
                    <BackToChallengeListButton />
                </div>
            </PageHeader>
            <PageContent>
                <ChallengeUserFilters
                    filterCriteria={filterCriteria}
                    onFilterCriteriaChange={setFilterCriteria}
                    onFilter={filter}
                    onFiltersInitialize={handleFilterIntialize}
                    disabled={filtering || removing || !filtersInited}
                    showResetButton={
                        previousPageChangeEvent.current
                        && filtered
                        && users.length === 0
                    }
                    onReset={handleReset}
                />
                <PageDivider />
                {filtering && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {filtered && users.length === 0 && (
                    <p className={styles.noRecordFound}> No users. </p>
                )}
                <Display visible={filtered && users.length !== 0}>
                    <ChallengeUserList
                        users={users}
                        onUsersRemove={remove}
                        paging={{
                            page: filterCriteria.page,
                            totalPages: Math.ceil(
                                totalUsers / filterCriteria.perPage,
                            ),
                        }}
                        onPageChange={handlePageChange}
                    />
                </Display>
            </PageContent>
            {openAddUserDialog && (
                <ChallengeAddUserDialog
                    open={openAddUserDialog}
                    setOpen={setOpenAddUserDialog}
                    onAdd={add}
                />
            )}
        </>
    )
}

/// /////////////////
// Filter reducer
/// /////////////////

const FilterActionType = {
    FILTER_DONE: 'FILTER_DONE' as const,
    FILTER_FAILED: 'FILTER_FAILED' as const,
    FILTER_INIT: 'FILTER_INIT' as const,
}

type FilterState = {
    isLoading: boolean
    filtered: boolean
    totalUsers: number
}

type FilterReducerAction =
    | {
          type:
              | typeof FilterActionType.FILTER_INIT
              | typeof FilterActionType.FILTER_FAILED
      }
    | {
          type: typeof FilterActionType.FILTER_DONE
          payload: {
              totalUsers: number
          }
      }

const filterReducer = (
    previousState: FilterState,
    action: FilterReducerAction,
): FilterState => {
    switch (action.type) {
        case FilterActionType.FILTER_INIT: {
            return {
                ...previousState,
                filtered: false,
                isLoading: true,
                totalUsers: 0,
            }
        }

        case FilterActionType.FILTER_DONE: {
            return {
                ...previousState,
                filtered: true,
                isLoading: false,
                totalUsers: action.payload.totalUsers,
            }
        }

        case FilterActionType.FILTER_FAILED: {
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

function useFilter({
    filterCriteria,
    challengeId,
}: {
    filterCriteria: ChallengeResourceFilterCriteria
    challengeId: string
}): {
    filter: () => Promise<ChallengeResource[]>
    filtered: boolean
    filtering: boolean
    totalUsers: number
} {
    const [state, dispatch] = useReducer(filterReducer, {
        filtered: false,
        isLoading: false,
        totalUsers: 0,
    })

    const filter = useEventCallback(async (): Promise<ChallengeResource[]> => {
        const checkIfLegacyId = async (id: string): Promise<string> => {
            if (/^[0-9]+$/.test(`${id}`)) {
                return (await getChallengeByLegacyId(+id)).id
            }

            return id
        }

        dispatch({ type: FilterActionType.FILTER_INIT })
        try {
            const id = await checkIfLegacyId(challengeId)
            const { data, total }: PaginatedResponse<ChallengeResource[]>
                = await getChallengeResources(id, filterCriteria)
            dispatch({
                payload: { totalUsers: total },
                type: FilterActionType.FILTER_DONE,
            })
            return data
        } catch (error) {
            dispatch({ type: FilterActionType.FILTER_FAILED })
            handleError(error)
            return []
        }
    })

    return {
        filter,
        filtered: state.filtered,
        filtering: state.isLoading,
        totalUsers: state.totalUsers,
    }
}

/// /////////////////
// Remove reducer
/// /////////////////

const RemoveActionType = {
    REMOVE_DONE: 'REMOVE_DONE' as const,
    REMOVE_FAILED: 'REMOVE_FAILED' as const,
    REMOVE_INIT: 'REMOVE_INIT' as const,
}

type RemoveActionType = {
    type:
        | typeof RemoveActionType.REMOVE_INIT
        | typeof RemoveActionType.REMOVE_FAILED
        | typeof RemoveActionType.REMOVE_DONE
}

type RemoveState = {
    isRemoving: number
    removed: boolean
}

const removeReducer = (
    previousState: RemoveState,
    action: RemoveActionType,
): RemoveState => {
    switch (action.type) {
        case RemoveActionType.REMOVE_INIT: {
            return {
                ...previousState,
                isRemoving: previousState.isRemoving + 1,
                removed: false,
            }
        }

        case RemoveActionType.REMOVE_DONE: {
            return {
                ...previousState,
                isRemoving: previousState.isRemoving - 1,
                removed: true,
            }
        }

        case RemoveActionType.REMOVE_FAILED: {
            return {
                ...previousState,
                isRemoving: previousState.isRemoving - 1,
            }
        }

        default: {
            return previousState
        }
    }
}

function useRemove({ challengeId }: { challengeId: string }): {
    remove: (user: ChallengeResource) => Promise<boolean>
    removed: boolean
    removing: boolean
} {
    const [state, dispatch] = useReducer(removeReducer, {
        isRemoving: 0,
        removed: false,
    })

    const remove = useEventCallback(
        async (user: ChallengeResource): Promise<boolean> => {
            dispatch({ type: RemoveActionType.REMOVE_INIT })

            try {
                await deleteChallengeResource({
                    challengeId,
                    memberHandle: user.memberHandle,
                    roleId: user.roleId,
                })
                dispatch({ type: RemoveActionType.REMOVE_DONE })
                return true
            } catch (error) {
                dispatch({ type: RemoveActionType.REMOVE_FAILED })
                handleError(error)
                return false
            }
        },
    )

    return {
        remove,
        removed: state.removed,
        removing: state.isRemoving !== 0,
    }
}

export default ManageUserPage
