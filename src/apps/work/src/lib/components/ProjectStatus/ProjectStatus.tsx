import { FC, useMemo } from 'react'
import { startCase } from 'lodash'
import classNames from 'classnames'

import { PROJECT_STATUSES } from '../../constants'
import { ProjectStatusValue } from '../../models'

import styles from './ProjectStatus.module.scss'

interface ProjectStatusProps {
    status: ProjectStatusValue
}

export const ProjectStatus: FC<ProjectStatusProps> = (props: ProjectStatusProps) => {
    const normalizedStatus = (props.status || '').toLowerCase() as ProjectStatusValue

    const statusLabel = useMemo(
        () => PROJECT_STATUSES.find(item => item.value === normalizedStatus)?.label
            || startCase(normalizedStatus),
        [normalizedStatus],
    )

    return (
        <span
            className={classNames(
                styles.container,
                styles[normalizedStatus],
            )}
        >
            {statusLabel}
        </span>
    )
}

export default ProjectStatus
