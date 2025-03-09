/**
 * Context provider for admin app
 */
import {
    Context,
    createContext,
    FC,
    PropsWithChildren,
    useEffect,
    useMemo,
} from 'react'
import _ from 'lodash'

import { AdminAppContextType } from '../models'
import { useLoadGroup, useLoadGroupProps, useLoadUser, useLoadUserProps } from '../hooks'

export const AdminAppContext: Context<AdminAppContextType>
    = createContext<AdminAppContextType>({
        cancelLoadGroup: _.noop,
        cancelLoadUser: _.noop,
        groupsMapping: {},
        loadGroup: _.noop,
        loadUser: _.noop,
        setGroupFromSearch: _.noop,
        setUserFromSearch: _.noop,
        usersMapping: {},
    })

export const AdminAppContextProvider: FC<PropsWithChildren> = props => {
    const {
        loadUser,
        setUserFromSearch,
        usersMapping,
        cancelLoadUser,
    }: useLoadUserProps = useLoadUser()
    const {
        loadGroup,
        groupsMapping,
        cancelLoadGroup,
        setGroupFromSearch,
    }: useLoadGroupProps = useLoadGroup()
    const value = useMemo(
        () => ({
            cancelLoadGroup,
            cancelLoadUser,
            groupsMapping,
            loadGroup,
            loadUser,
            setGroupFromSearch,
            setUserFromSearch,
            usersMapping,
        }),
        [
            loadUser,
            setUserFromSearch,
            usersMapping,
            cancelLoadUser,
            groupsMapping,
            loadGroup,
            cancelLoadGroup,
            setGroupFromSearch,
        ],
    )

    useEffect(() => () => {
        // clear queue of currently loading user handles after exit ui
        cancelLoadUser()
        // clear queue of currently loading group handles after exit ui
        cancelLoadGroup()
    }, [cancelLoadUser, cancelLoadGroup])

    return (
        <AdminAppContext.Provider value={value}>
            {props.children}
        </AdminAppContext.Provider>
    )
}
