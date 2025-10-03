import {
    createContext,
    Dispatch,
    FC,
    PropsWithChildren,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import _ from 'lodash'

import { useWindowSize, WindowSize } from '~/libs/shared'
import {
    Button,
    InputCheckbox,
    LoadingSpinner,
    Table,
    type TableColumn,
} from '~/libs/ui'

import {
    Challenge,
    ChallengeResource,
    ChallengeStatus,
    ResourceEmail,
} from '../../models'
import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
} from '../../contexts'
import { getChallengeById, getResourceEmails } from '../../services'
import { RemoveUsersConfirmDialog } from '../RemoveUsersConfirmDialog'
import { useEventCallback, useOnComponentDidMount } from '../../hooks'
import { Paging } from '../../models/challenge-management/Pagination'
import { Pagination } from '../common/Pagination'
import { CopyButton } from '../CopyButton'

import { MobileListView } from './MobileListView'
import styles from './ChallengeUserList.module.scss'

export interface ChallengeUserListProps {
    users: ChallengeResource[]
    paging: Paging
    onUsersRemove: (users: Array<ChallengeResource>) => void
    onPageChange: (page: number) => void
}

export interface ChallengeUserListContextType {
    challenge?: Challenge
    users: ChallengeResource[]
    userEmails: ResourceEmail[]
    selectedUsers: Set<ChallengeResource['id']>
    removingUsers: Set<ChallengeResource['id']>
    setSelectedUsers: Dispatch<SetStateAction<Set<ChallengeResource['id']>>>
    setRemovingUsers: Dispatch<SetStateAction<Set<ChallengeResource['id']>>>
}

const ChallengeUserListContext = createContext<ChallengeUserListContextType>({
    removingUsers: new Set(),
    selectedUsers: new Set(),
    setRemovingUsers: () => undefined,
    setSelectedUsers: () => undefined,
    userEmails: [],
    users: [],
})

const HeaderCheckbox: FC = () => {
    const { users }: { users: ChallengeResource[] } = useContext(
        ChallengeUserListContext,
    )
    const {
        removingUsers,
        selectedUsers,
        setSelectedUsers,
    }: ChallengeUserListContextType = useContext(ChallengeUserListContext)
    const selectedAll = users.every(usr => selectedUsers.has(usr.id))
    const toggleUsersSelection = useEventCallback((): void => {
        if (selectedAll) setSelectedUsers(() => new Set<ChallengeResource['id']>())
        else {
            setSelectedUsers(() => {
                const newSet = new Set<ChallengeResource['id']>()
                users.forEach(usr => newSet.add(usr.id))
                return newSet
            })
        }
    })

    const isRemoving = removingUsers.size !== 0
    const noop = useCallback(() => undefined, [])

    return (
        <div className={styles.headerCheckboxWrapper}>
            <InputCheckbox
                checked={selectedAll}
                name='select-users'
                onChange={noop}
                onClick={toggleUsersSelection}
                disabled={isRemoving}
            />
        </div>
    )
}

const RowCheckbox: FC<{ user: ChallengeResource }> = props => {
    const {
        removingUsers,
        selectedUsers,
        setSelectedUsers,
    }: ChallengeUserListContextType = useContext(ChallengeUserListContext)

    const onToggle = useEventCallback(() => {
        setSelectedUsers(previous => {
            const newSet = new Set(previous)
            if (newSet.has(props.user.id)) {
                newSet.delete(props.user.id)
            } else {
                newSet.add(props.user.id)
            }

            return newSet
        })
    })

    const isRemoving = removingUsers.has(props.user.id)
    const noop = useCallback(() => undefined, [])

    return (
        <InputCheckbox
            checked={selectedUsers.has(props.user.id)}
            name={`select-user-${props.user.id}`}
            onChange={noop}
            onClick={onToggle}
            disabled={isRemoving}
        />
    )
}

const UserRole: FC<{ user: ChallengeResource }> = props => {
    const {
        resourceRoles: roles,
    }: { resourceRoles: ChallengeManagementContextType['resourceRoles'] }
        = useContext(ChallengeManagementContext)

    const s = useMemo(() => {
        if (roles.length === 0) {
            return 'Loading...'
        }

        const role = _.find(roles, { id: props.user.roleId })

        return role?.name || 'NOT FOUND'
    }, [roles, props.user.roleId])

    return <>{s}</>
}

const UserEmailWithCopy: FC<{ user: ChallengeResource }> = props => {
    const { userEmails }: { userEmails: ResourceEmail[] } = useContext(
        ChallengeUserListContext,
    )

    const email = useMemo(() => {
        if (userEmails.length === 0) {
            return ''
        }

        const usr = _.find(userEmails, {
            userId: parseInt(props.user.memberId, 10),
        })

        return usr?.email || ''
    }, [userEmails, props.user.memberId])

    if (!email) {
        return <span>Loading...</span>
    }

    return (
        <div className={styles.emailCell}>
            <span className={styles.emailText}>{email}</span>
            <CopyButton text={email} />
        </div>
    )
}

const RemoveButton: FC<{
    user: ChallengeResource
    onUsersRemove: ChallengeUserListProps['onUsersRemove']
}> = props => {
    const {
        removingUsers,
        setRemovingUsers,
        challenge,
    }: ChallengeUserListContextType = useContext(ChallengeUserListContext)
    const [openRemoveUsersConfirmDialog, setOpenRemoveUsersConfirmDialog]: [
        boolean,
        Dispatch<SetStateAction<boolean>>,
    ] = useState<boolean>(false)

    const handleRemove = useEventCallback((): void => {
        setRemovingUsers(previous => {
            const newSet = new Set(previous)
            newSet.add(props.user.id)
            return newSet
        })
        props.onUsersRemove([props.user])
    })
    const handleOpenRemoveUsersConfirmDialog = useEventCallback(() => setOpenRemoveUsersConfirmDialog(true))

    const isRemoving = removingUsers.has(props.user.id)

    return (
        <>
            {isRemoving ? (
                <LoadingSpinner
                    inline
                    className={styles.removingLoadingSpinner}
                />
            ) : (
                <Button
                    primary
                    variant='danger'
                    onClick={handleOpenRemoveUsersConfirmDialog}
                    disabled={
                        isRemoving
                        || !challenge
                        || challenge.status === ChallengeStatus.Completed
                    }
                >
                    Remove
                </Button>
            )}

            {openRemoveUsersConfirmDialog && (
                <RemoveUsersConfirmDialog
                    open={openRemoveUsersConfirmDialog}
                    setOpen={setOpenRemoveUsersConfirmDialog}
                    users={[props.user]}
                    remove={handleRemove}
                />
            )}
        </>
    )
}

const RemoveSelectionButton: FC<{
    onUsersRemove: ChallengeUserListProps['onUsersRemove']
}> = props => {
    const {
        users,
        selectedUsers,
        removingUsers,
        setRemovingUsers,
        challenge,
    }: ChallengeUserListContextType = useContext(ChallengeUserListContext)
    const [openRemoveUsersConfirmDialog, setOpenRemoveUsersConfirmDialog]: [
        boolean,
        Dispatch<SetStateAction<boolean>>,
    ] = useState<boolean>(false)

    const selection = users.filter(usr => selectedUsers.has(usr.id))
    const handleRemove = useEventCallback(() => {
        setRemovingUsers(previous => {
            const newSet = new Set(previous)
            selectedUsers.forEach(usr => newSet.add(usr))
            return newSet
        })

        props.onUsersRemove(selection)
    })

    const isRemoving = removingUsers.size !== 0
    const handleOpenRemoveUsersConfirmDialog = useEventCallback(() => setOpenRemoveUsersConfirmDialog(true))

    return (
        <>
            <Button
                primary
                variant='danger'
                onClick={handleOpenRemoveUsersConfirmDialog}
                disabled={
                    !selectedUsers.size
                    || isRemoving
                    || challenge?.status === ChallengeStatus.Completed
                }
                size='lg'
            >
                Remove Selected
            </Button>
            {openRemoveUsersConfirmDialog && (
                <RemoveUsersConfirmDialog
                    open={openRemoveUsersConfirmDialog}
                    setOpen={setOpenRemoveUsersConfirmDialog}
                    users={selection}
                    remove={handleRemove}
                />
            )}
        </>
    )
}

const ChallengeUserListContextProvider: FC<
    PropsWithChildren<{ users: ChallengeResource[] }>
> = props => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
    const { userEmails }: { userEmails: ResourceEmail[] } = useUserEmails(
        props.users,
    )
    const [selectedUsers, setSelectedUsers] = useState<
        Set<ChallengeResource['id']>
    >(new Set())
    const [removingUsers, setRemovingUsers] = useState<
        Set<ChallengeResource['id']>
    >(new Set())
    const [challenge, setChallenge] = useState<Challenge>()

    const loadChallenge = (): void => {
        getChallengeById(challengeId)
            .then((data: Challenge) => {
                setChallenge(data)
            })
    }

    useOnComponentDidMount(() => {
        loadChallenge()
    })

    useEffect(() => {
        setSelectedUsers(oldSelectedUsers => {
            const newSet = new Set(oldSelectedUsers)
            newSet.forEach(usr => {
                if (!props.users.find(i => i.id === usr)) newSet.delete(usr)
            })
            return newSet
        })

        setRemovingUsers(oldRemovingUsers => {
            const newSet = new Set(oldRemovingUsers)
            newSet.forEach(usr => {
                if (!props.users.find(i => i.id === usr)) newSet.delete(usr)
            })
            return newSet
        })
    }, [props.users])

    const context = useMemo(
        () => ({
            challenge,
            removingUsers,
            selectedUsers,
            setRemovingUsers,
            setSelectedUsers,
            userEmails,
            users: props.users,
        }),
        [
            challenge,
            removingUsers,
            selectedUsers,
            setRemovingUsers,
            setSelectedUsers,
            userEmails,
            props.users,
        ],
    )
    return (
        <ChallengeUserListContext.Provider value={context}>
            {props.children}
        </ChallengeUserListContext.Provider>
    )
}

const ChallengeUserList: FC<ChallengeUserListProps> = props => {
    const columns = useMemo<TableColumn<ChallengeResource>[]>(
        () => [
            {
                label: () => <HeaderCheckbox />, // eslint-disable-line react/no-unstable-nested-components
                renderer: (user: ChallengeResource) => (
                    <RowCheckbox user={user} />
                ),
                type: 'element',
            },
            { label: 'Handle', propertyName: 'memberHandle', type: 'text' },
            {
                label: 'Role',
                propertyName: 'roleId',
                renderer: (user: ChallengeResource) => <UserRole user={user} />,
                type: 'element',
            },
            {
                label: 'E-Mail',
                propertyName: 'memberId',
                renderer: (user: ChallengeResource) => (
                    <UserEmailWithCopy user={user} />
                ),
                type: 'element',
            },
            {
                label: 'Registered',
                propertyName: 'created',
                renderer: (user: ChallengeResource) => (
                    <div className={styles.registeredCell}>{user.created}</div>
                ),
                type: 'element',
            },
            {
                label: '',
                renderer: (user: ChallengeResource) => (
                    <RemoveButton
                        user={user}
                        onUsersRemove={props.onUsersRemove}
                    />
                ),
                type: 'action',
            },
        ],
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: props.onUsersRemove
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    return (
        <ChallengeUserListContextProvider users={props.users}>
            <div className={styles.challengeUserList}>
                {screenWidth > 984 && (
                    <Table
                        columns={columns}
                        data={props.users}
                        disableSorting
                        className={styles.desktopTable}
                    />
                )}
                {screenWidth <= 984 && (
                    <MobileListView
                        properties={columns}
                        data={props.users}
                        selectAllCheckbox={<HeaderCheckbox />}
                    />
                )}
                <div className={styles.removeSelectionButtonContainer}>
                    <RemoveSelectionButton
                        onUsersRemove={props.onUsersRemove}
                    />
                </div>
                <Pagination
                    page={props.paging.page}
                    totalPages={props.paging.totalPages}
                    onPageChange={props.onPageChange}
                />
            </div>
        </ChallengeUserListContextProvider>
    )
}

function useUserEmails(users: ChallengeResource[]): {
    userEmails: ResourceEmail[]
} {
    const [userEmails, setUserEmails] = useState<ResourceEmail[]>([])

    useEffect(() => {
        getResourceEmails(users)
            .then(data => {
                setUserEmails(data)
            })
    }, [users])

    return { userEmails }
}

export default ChallengeUserList
