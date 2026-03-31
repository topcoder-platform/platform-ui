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
    const {
        hash,
        pathname,
        search,
    }: {
        hash: string
        pathname: string
        search: string
    } = useLocation()
    const challengesPath = `/projects/${props.projectId}/challenges`
    const engagementsPath = `/projects/${props.projectId}/engagements`
    const usersPath = `/projects/${props.projectId}/users`
    const assetsPath = `/projects/${props.projectId}/assets`

    const isChallengesActive = isTabActive(pathname, challengesPath)
    const isEngagementsActive = isTabActive(pathname, engagementsPath)
    const isUsersActive = isTabActive(pathname, usersPath)
    const isAssetsActive = isTabActive(pathname, assetsPath)
    const usersLinkState = isUsersActive
        ? undefined
        : {
            backTo: `${pathname}${search}${hash}`,
        }

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
            <Link
                className={classNames(styles.tabLink, isUsersActive ? styles.active : undefined)}
                state={usersLinkState}
                to={usersPath}
            >
                Users
            </Link>
            <Link
                className={classNames(styles.tabLink, isAssetsActive ? styles.active : undefined)}
                to={assetsPath}
            >
                Assets Library
            </Link>
        </div>
    )
}

export default ProjectListTabs
