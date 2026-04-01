import {
    FC,
    useContext,
} from 'react'
import { Link } from 'react-router-dom'

import {
    groupsRouteId,
    rootRoute,
} from '../../../../../config/routes.config'
import { WorkAppContext } from '../../../../../lib/contexts/WorkAppContext'
import { FormGroupsSelect } from '../../../../../lib/components/form'

import styles from './GroupsField.module.scss'

export const GroupsField: FC = () => {
    const workAppContext = useContext(WorkAppContext)
    const canManageGroups = workAppContext.isAdmin || workAppContext.isCopilot || workAppContext.isManager
    const createGroupPath = rootRoute
        ? `${rootRoute}/${groupsRouteId}`
        : `/${groupsRouteId}`

    return (
        <div className={styles.container}>
            <div className={styles.selectField}>
                <FormGroupsSelect
                    label='Groups'
                    name='groups'
                />
            </div>
            {canManageGroups
                ? (
                    <Link
                        className={styles.createGroupLink}
                        rel='noreferrer'
                        target='_blank'
                        to={createGroupPath}
                    >
                        Create Group
                    </Link>
                )
                : undefined}
        </div>
    )
}

export default GroupsField
