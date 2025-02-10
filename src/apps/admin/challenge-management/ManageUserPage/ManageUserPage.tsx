import { Dispatch, FC, SetStateAction, useContext, useReducer, useState } from 'react'
import { Button, LinkButton, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    ChallengeAddUserDialog,
    ChallengeUserFilters,
    ChallengeUserList,
    PageContent,
    PageHeader,
} from '../../lib/components'
import { ChallengeFilterCriteria, ChallengeResource, ChallengeResourceFilterCriteria } from '../../lib/models'
import { useOnComponentDidMount } from '../../lib/hooks'
import {
    addChallengeResource,
    deleteChallengeResource,
    getChallengeByLegacyId,
    getChallengeResources,
} from '../../lib/services'
import { rootRoute } from '../../admin-app.routes'
import { createChallengeQueryString, handleError } from '../../lib/utils'
import styles from './ManageUserPage.module.scss'

const BackToChallengeListButton: FC = () => {
    const location = useLocation()
    const routeState: { previousChallengeListFilter: ChallengeFilterCriteria } = location.state || {}
    const qs = routeState.previousChallengeListFilter
        ? `?${createChallengeQueryString(routeState.previousChallengeListFilter)}`
        : ''
    return (
        <LinkButton primary light to={`${rootRoute}/challenge-management${qs}`} size='lg'>
            Back
        </LinkButton>
    )
}

/**
 * Manage Users page.
 */
export const ManageUserPage: FC = () => {
    const pageTitle = 'Manage Users'
    const { challengeId = '' } = useParams()
    const [filterCriteria, setFilterCriteria]: [
    ChallengeResourceFilterCriteria,
    Dispatch<SetStateAction<ChallengeResourceFilterCriteria>>,
  ] = useState<ChallengeResourceFilterCriteria>({
      page: 1,
      perPage: 25,
      roleId: '',
  })
    const [users, setUsers] = useState<Array<ChallengeResource>>([])
    const { filter: doFilter, filtering, filtered } = useFilter({ filterCriteria, challengeId })
    const { remove: doRemove, removing, removed } = useRemove({ challengeId })
    const [openAddUserDialog, setOpenAddUserDialog] = useState(false)

    const filter = () => {
        doFilter()
            .then(data => {
                setUsers(data)
            })
    }

    const remove = (usersToRemove: Array<ChallengeResource>) => {
        const removeUser = (user: ChallengeResource) => setUsers(oldUsers => oldUsers.filter(i => i.id !== user.id))

        if (usersToRemove.length === 1) {
            doRemove(usersToRemove[0])
                .then(() => removeUser(usersToRemove[0]))
        } else {
            Promise.all(usersToRemove.map(usr => doRemove(usr)
                .then(() => removeUser(usr))))
        }
    }

    const add = async ({ handles, roleId }: { handles: string[]; roleId: string }) => {
        let successCount = 0
        await Promise.all(
            handles.map(handle => addChallengeResource({
                challengeId,
                memberHandle: handle,
                roleId,
            })
                .then(() => {
                    successCount++
                })
                .catch(handleError)),
        )
        if (successCount) {
            const msg = successCount > 1 ? `${successCount} users have been added.` : 'User has been added.'
            toast.success(msg)
            filter()
        }
    }

    useOnComponentDidMount(() => {
        filter()
    })

    return (
        <>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader noBackground>
                <h2>{pageTitle}</h2>
                <div className={styles.headerActions}>
                    <Button primary onClick={() => setOpenAddUserDialog(true)} size='lg'>
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
                    isFilteringOrRemoving={filtering || removing}
                />
                <PageDivider />
                {filtering && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {filtered && users.length === 0 && <p className={styles.noRecordFound}> No users. </p>}
                {filtered && users.length !== 0 && <ChallengeUserList users={users} onUsersRemove={remove} />}
            </PageContent>
            <ChallengeAddUserDialog open={openAddUserDialog} setOpen={setOpenAddUserDialog} onAdd={add} />
        </>
    )
}

/// /////////////////
// Filter reducer
/// /////////////////

const FilterActionType = {
    FILTER_INIT: 'FILTER_INIT' as const,
    FILTER_DONE: 'FILTER_DONE' as const,
    FILTER_FAILED: 'FILTER_FAILED' as const,
}

type FilterState = {
  isLoading: boolean
  filtered: boolean
  totalUsers: number
}

type FilterReducerAction =
  | {
      type: typeof FilterActionType.FILTER_INIT | typeof FilterActionType.FILTER_FAILED
    }
  | {
      type: typeof FilterActionType.FILTER_DONE
      payload: {
        totalUsers: number
      }
    }

const filterReducer = (previousState: FilterState, action: FilterReducerAction): FilterState => {
    const { type } = action

    switch (type) {
        case FilterActionType.FILTER_INIT: {
            return {
                ...previousState,
                isLoading: true,
                filtered: false,
                totalUsers: 0,
            }
        }

        case FilterActionType.FILTER_DONE: {
            return {
                ...previousState,
                isLoading: false,
                filtered: true,
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
}) {
    const [state, dispatch] = useReducer(filterReducer, {
        isLoading: false,
        filtered: false,
        totalUsers: 0,
    })

    const filter = async () => {
        const checkIfLegacyId = async (id: string): Promise<string> => {
            if (/^[0-9]+$/.test(`${id}`)) {
                return (await getChallengeByLegacyId(+id)).id
            }

            return id
        }

        dispatch({ type: FilterActionType.FILTER_INIT })
        try {
            const id = await checkIfLegacyId(challengeId)
            const { data, total } = await getChallengeResources(id, filterCriteria)
            dispatch({ type: FilterActionType.FILTER_DONE, payload: { totalUsers: total } })
            return data
        } catch (error) {
            dispatch({ type: FilterActionType.FILTER_FAILED })
            handleError(error)
            return []
        }
    }

    return {
        filtering: state.isLoading,
        filtered: state.filtered,
        filter,
    }
}

/// /////////////////
// Remove reducer
/// /////////////////

const RemoveActionType = {
    REMOVE_INIT: 'REMOVE_INIT' as const,
    REMOVE_DONE: 'REMOVE_DONE' as const,
    REMOVE_FAILED: 'REMOVE_FAILED' as const,
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

const removeReducer = (previousState: RemoveState, action: RemoveActionType): RemoveState => {
    const { type } = action

    switch (type) {
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

function useRemove({ challengeId }: { challengeId: string }) {
    const [state, dispatch] = useReducer(removeReducer, {
        isRemoving: 0,
        removed: false,
    })

    const remove = async (user: ChallengeResource) => {
        dispatch({ type: RemoveActionType.REMOVE_INIT })

        try {
            await deleteChallengeResource({ challengeId, memberHandle: user.memberHandle, roleId: user.roleId })
            dispatch({ type: RemoveActionType.REMOVE_DONE })
            return true
        } catch (error) {
            dispatch({ type: RemoveActionType.REMOVE_FAILED })
            handleError(error)
            return false
        }
    }

    return {
        remove,
        removing: state.isRemoving !== 0,
        removed: state.removed,
    }
}

export default ManageUserPage
