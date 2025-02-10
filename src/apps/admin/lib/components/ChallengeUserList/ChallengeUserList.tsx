import {
    createContext,
    Dispatch,
    FC,
    PropsWithChildren,
    ReactElement,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Button, InputCheckbox, LoadingSpinner, Table, type TableColumn } from '~/libs/ui'
import _ from 'lodash'
import { Challenge, ChallengeResource, ChallengeStatus, ResourceEmail } from '../../models'

import { ChallengeManagementContext } from '../../contexts'
import { getChallengeById, getResourceEmails } from '../../services'
import { RemoveUsersConfirmDialog } from '../RemoveUsersConfirmDialog'
import styles from './ChallengeUserList.module.scss'
import { useOnComponentDidMount } from '../../hooks'
import { useParams } from 'react-router-dom'
import { useWindowSize } from '~/libs/shared'
import { MobileListView } from './MobileListView'
import { Paging } from '../../models/challenge-management/Pagination'
import { Pagination } from '../common/Pagination'

export interface ChallengeUserListProps {
  users: ChallengeResource[]
  paging: Paging
  onUsersRemove: (users: Array<ChallengeResource>) => void
  onPageChange: (page: number) => void
}

const ChallengeUserListContext = createContext<{
  challenge?: Challenge
  users: ChallengeResource[]
  userEmails: ResourceEmail[]
  selectedUsers: Set<ChallengeResource['id']>
  removingUsers: Set<ChallengeResource['id']>
  setSelectedUsers: Dispatch<SetStateAction<Set<ChallengeResource['id']>>>
  setRemovingUsers: Dispatch<SetStateAction<Set<ChallengeResource['id']>>>
}>({
    users: [],
    userEmails: [],
    selectedUsers: new Set(),
    removingUsers: new Set(),
    setSelectedUsers: () => {},
    setRemovingUsers: () => {},
})

const HeaderCheckbox: FC = () => {
    const { users } = useContext(ChallengeUserListContext)
    const { removingUsers, selectedUsers, setSelectedUsers } = useContext(ChallengeUserListContext)
  const selectedAll = users.every((usr) => selectedUsers.has(usr.id))
    const toggleUsersSelection = () => {
        if (selectedAll) setSelectedUsers(() => new Set<ChallengeResource['id']>())
        else {
            setSelectedUsers(() => {
                const newSet = new Set<ChallengeResource['id']>()
        users.forEach((usr) => newSet.add(usr.id))
                return newSet
            })
        }
    }

    const isRemoving = removingUsers.size !== 0

    return (
        <div className={styles.headerCheckboxWrapper}>
            <InputCheckbox
                checked={selectedAll}
                name='select-users'
                onChange={() => {}}
                onClick={toggleUsersSelection}
                disabled={isRemoving}
            />
        </div>
    )
}

const RowCheckbox: FC<{ user: ChallengeResource }> = ({ user }) => {
    const { removingUsers, selectedUsers, setSelectedUsers } = useContext(ChallengeUserListContext)

    const onToggle = () => {
    setSelectedUsers((previous) => {
            const newSet = new Set(previous)
            if (newSet.has(user.id)) {
                newSet.delete(user.id)
            } else {
                newSet.add(user.id)
            }

            return newSet
        })
    }

    const isRemoving = removingUsers.has(user.id)

    return (
        <InputCheckbox
            checked={selectedUsers.has(user.id)}
            name={`select-user-${user.id}`}
            onChange={() => {}}
            onClick={onToggle}
            disabled={isRemoving}
        />
    )
}

const UserRole: FC<{ user: ChallengeResource }> = ({ user }) => {
    const { resourceRoles: roles } = useContext(ChallengeManagementContext)

    const s = useMemo(() => {
        if (roles.length === 0) {
            return 'Loading...'
        }

        const role = _.find(roles, { id: user.roleId })

        return role?.name || 'NOT FOUND'
    }, [roles, user.roleId])

    return <>{s}</>
}

const UserEmail: FC<{ user: ChallengeResource }> = ({ user }) => {
    const { userEmails } = useContext(ChallengeUserListContext)
    const s = useMemo(() => {
        if (userEmails.length === 0) {
            return 'Loading...'
        }

        const usr = _.find(userEmails, { userId: parseInt(user.memberId) })

        return usr?.email || 'NOT FOUND'
    }, [userEmails, user.memberId])

    return <>{s}</>
}

const RemoveButton: FC<{ user: ChallengeResource; onUsersRemove: ChallengeUserListProps['onUsersRemove'] }> = ({
    user,
    onUsersRemove,
}) => {
  const { removingUsers, setRemovingUsers, challenge } = useContext(ChallengeUserListContext)
    const [openRemoveUsersConfirmDialog, setOpenRemoveUsersConfirmDialog] = useState<boolean>(false)

    const handleRemove = () => {
        setRemovingUsers(previous => {
            const newSet = new Set(previous)
            newSet.add(user.id)
            return newSet
        })
        onUsersRemove([user])
    }

    const isRemoving = removingUsers.has(user.id)

    return (
        <>
        {isRemoving ?
            (   <LoadingSpinner inline className={styles.removingLoadingSpinner} />
            ) : (
                <Button
                primary
                variant='danger'
                onClick={() => setOpenRemoveUsersConfirmDialog(true)}
                disabled={isRemoving || !challenge || challenge.status === ChallengeStatus.Completed}
                >
                    Remove
                </Button>
        )}

        {openRemoveUsersConfirmDialog && (
            <RemoveUsersConfirmDialog
                open={openRemoveUsersConfirmDialog}
                setOpen={setOpenRemoveUsersConfirmDialog}
                users={[user]}
                remove={handleRemove}
            />
        )}
        </>
    )
}

const RemoveSelectionButton: FC<{ onUsersRemove: ChallengeUserListProps['onUsersRemove'] }> = ({ onUsersRemove }) => {
  const { users, selectedUsers, removingUsers, setRemovingUsers, challenge } = useContext(ChallengeUserListContext)
    const [openRemoveUsersConfirmDialog, setOpenRemoveUsersConfirmDialog] = useState<boolean>(false)

    const selection = users.filter(usr => selectedUsers.has(usr.id))
    const handleRemove = () => {
        setRemovingUsers(previous => {
            const newSet = new Set(previous)
            selectedUsers.forEach(usr => newSet.add(usr))
            return newSet
        })

        onUsersRemove(selection)
    }

    const isRemoving = removingUsers.size !== 0

    return (
        <>
            <Button
                primary
                variant='danger'
                onClick={() => setOpenRemoveUsersConfirmDialog(true)}
                disabled={!selectedUsers.size || isRemoving || challenge?.status === ChallengeStatus.Completed}
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

const ChallengeUserList: FC<ChallengeUserListProps> = ({ users, paging, onUsersRemove, onPageChange }) => {
    const columns = useMemo<TableColumn<ChallengeResource>[]>(
        () => [
            {
                label: () => <HeaderCheckbox />,
                type: 'element',
                renderer: (user: ChallengeResource) => <RowCheckbox user={user} />,
            },
            { label: 'Handle', type: 'text', propertyName: 'memberHandle' },
            {
                label: 'Role',
                type: 'element',
                propertyName: 'roleId',
                renderer: (user: ChallengeResource) => <UserRole user={user} />,
            },
            {
                label: 'E-Mail',
                type: 'element',
                propertyName: 'memberId',
                renderer: (user: ChallengeResource) => <UserEmail user={user} />,
            },
            {
                label: 'Registered',
                type: 'element',
                propertyName: 'created',
                renderer: (user: ChallengeResource) => <div className={styles.registeredCell}>{user.created}</div>,
            },
            {
                label: '',
                type: 'action',
                renderer: (user: ChallengeResource) => <RemoveButton user={user} onUsersRemove={onUsersRemove} />,
            },
        ],
        [],
    )

  const { width: screenWidth } = useWindowSize()
    return (
        <ChallengeUserListContextProvider users={users}>
            <div className={styles.challengeUserList}>
                {screenWidth > 984 && <Table columns={columns} data={users} disableSorting />}
                {screenWidth <= 984 && (
                <MobileListView properties={columns} data={users} selectAllCheckbox={<HeaderCheckbox />} />
                )}
                <div className={styles.removeSelectionButtonContainer}>
                    <RemoveSelectionButton onUsersRemove={onUsersRemove} />
                </div>
                <Pagination page={paging.page} totalPages={paging.totalPages} onPageChange={onPageChange} />
            </div>
        </ChallengeUserListContextProvider>
    )
}

const ChallengeUserListContextProvider = ({ users, children }: PropsWithChildren<{ users: ChallengeResource[] }>) => {
    const { challengeId = '' } = useParams()
    const { userEmails } = useUserEmails(users)
    const [selectedUsers, setSelectedUsers] = useState<Set<ChallengeResource['id']>>(new Set())
    const [removingUsers, setRemovingUsers] = useState<Set<ChallengeResource['id']>>(new Set())
    const [challenge, setChallenge] = useState<Challenge>()

    const loadChallenge = () => {
        getChallengeById(challengeId).then((data: Challenge) => {
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
                if (!users.find(i => i.id === usr)) newSet.delete(usr)
            })
            return newSet
        })

        setRemovingUsers(oldRemovingUsers => {
            const newSet = new Set(oldRemovingUsers)
            newSet.forEach(usr => {
                if (!users.find(i => i.id === usr)) newSet.delete(usr)
            })
            return newSet
        })
    }, [users])

    return (
        <ChallengeUserListContext.Provider
      value={{ users, userEmails, selectedUsers, removingUsers, setSelectedUsers, setRemovingUsers, challenge }}
        >
            {children}
        </ChallengeUserListContext.Provider>
    )
}

function useUserEmails(users: ChallengeResource[]) {
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
