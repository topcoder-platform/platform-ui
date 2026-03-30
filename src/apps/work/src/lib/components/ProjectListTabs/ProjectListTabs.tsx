import { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import classNames from 'classnames'

import styles from './ProjectListTabs.module.scss'

interface ProjectListTabsProps {
    projectId: string
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isTabActive(pathname: string, tabPath: string): boolean {
    const normalizedPathname = pathname.replace(/\/+$/, '')
    const pattern = new RegExp(`${escapeRegExp(tabPath)}(?:/|$)`)

    return pattern.test(normalizedPathname)
}

export const ProjectListTabs: FC<ProjectListTabsProps> = (props: ProjectListTabsProps) => {
    const { pathname }: { pathname: string } = useLocation()
    const challengesPath = `/projects/${props.projectId}/challenges`
    const engagementsPath = `/projects/${props.projectId}/engagements`

    const isChallengesActive = isTabActive(pathname, challengesPath)
    const isEngagementsActive = isTabActive(pathname, engagementsPath)

    return (
        <div className={styles.container}>
            <Link
                className={classNames(styles.tabLink, isChallengesActive ? styles.active : undefined)}
                to={challengesPath}
            >
                Challenges
            </Link>
            <Link
                className={classNames(styles.tabLink, isEngagementsActive ? styles.active : undefined)}
                to={engagementsPath}
            >
                Engagements
            </Link>
        </div>
    )
}

export default ProjectListTabs
