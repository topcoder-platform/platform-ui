import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { Project } from '../../models'
import { formatDateTime } from '../../utils'
import { ProjectStatus } from '../ProjectStatus'

import styles from './ProjectCard.module.scss'

interface ProjectCardProps {
    canEdit?: boolean
    project: Project
    selected?: boolean
}

export const ProjectCard: FC<ProjectCardProps> = (props: ProjectCardProps) => {
    const project: Project = props.project
    const projectId: string = String(project.id)
    const isInvited = project.isInvited ?? !!project.invites?.length
    const path: string = `/projects/${projectId}/${isInvited ? 'invitations' : 'challenges'}`
    const editPath = `/projects/${projectId}/edit`

    const lastActivity = formatDateTime(
        project.lastActivityAt || project.updatedAt || project.createdAt,
    )

    return (
        <div className={styles.container}>
            <Link
                to={path}
                className={classNames(
                    styles.cardLink,
                    props.selected ? styles.selected : undefined,
                )}
            >
                <div className={styles.header}>
                    <div className={styles.name}>{project.name}</div>
                    <ProjectStatus status={project.status} />
                </div>
                <div className={styles.meta}>
                    <span className={styles.metaLabel}>Last activity:</span>
                    <span className={styles.metaValue}>{lastActivity}</span>
                </div>
            </Link>
            {props.canEdit
                ? (
                    <div className={styles.actions}>
                        <Link className={styles.actionLink} to={editPath}>
                            Edit
                        </Link>
                    </div>
                )
                : undefined}
        </div>
    )
}

export default ProjectCard
