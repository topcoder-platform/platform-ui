import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    Project,
} from '../../models'
import {
    ProjectStatus,
} from '../ProjectStatus'

import styles from './TaasProjectCard.module.scss'

interface TaasProjectCardProps {
    canEdit?: boolean
    project: Project
}

export const TaasProjectCard: FC<TaasProjectCardProps> = (props: TaasProjectCardProps) => {
    const project = props.project
    const projectId = String(project.id)
    const editPath = `/taas/${projectId}/edit`

    const cardContent = (
        <div className={styles.header}>
            <div className={styles.name}>{project.name}</div>
            <ProjectStatus status={project.status} />
        </div>
    )

    return (
        <div className={styles.container}>
            {props.canEdit
                ? (
                    <Link
                        className={classNames(styles.cardLink, styles.clickable)}
                        to={editPath}
                    >
                        {cardContent}
                    </Link>
                )
                : (
                    <div className={styles.cardLink}>
                        {cardContent}
                    </div>
                )}
        </div>
    )
}

export default TaasProjectCard
