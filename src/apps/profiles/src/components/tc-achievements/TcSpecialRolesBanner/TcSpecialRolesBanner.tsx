import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    MemberRoleStats,
    MemberSpecialRole,
    UserProfile,
} from '~/libs/core'
import { IconOutline, Tooltip } from '~/libs/ui'

import { getUserProfileRoleRoute } from '../../../profiles.routes'
import { formatPlural } from '../../../lib'

import styles from './TcSpecialRolesBanner.module.scss'

interface TcSpecialRolesBannerProps {
    profile: UserProfile
    roleStats?: MemberRoleStats
}

interface SpecialRoleCardConfig {
    challengeCount: number
    role: MemberSpecialRole
    tooltip: ReactNode
}

const roleTooltips: Record<MemberSpecialRole, string> = {
    copilot: 'A Topcoder Copilot is an elite expert who turns client’s requirements into challenges'
        + ' and guides the community to deliver quality solutions.',
    reviewer: 'A Topcoder reviewer is an expert community member who evaluates submissions,'
        + ' scores them against requirements, and provides actionable feedback.',
}

/**
 * Converts a member role identifier to the title casing used in the profile cards.
 *
 * This function does not throw.
 *
 * @param {MemberSpecialRole} role - Copilot or reviewer role identifier.
 * @returns {string} Human-readable role title.
 */
const getRoleTitle = (role: MemberSpecialRole): string => (
    role === 'copilot' ? 'Copilot' : 'Reviewer'
)

/**
 * Renders the linked Figma summary card for one profile special role.
 *
 * This component does not throw.
 *
 * @param {SpecialRoleCardConfig & { profile: UserProfile }} props - Role count, tooltip, and profile route data.
 * @returns {JSX.Element} One linked special-role card.
 */
const SpecialRoleCard: FC<SpecialRoleCardConfig & { profile: UserProfile }> = props => {
    const roleTitle = getRoleTitle(props.role)

    return (
        <div className={classNames(styles.roleCard, styles[props.role])}>
            <Link
                aria-label={`View ${roleTitle} challenge details`}
                className={styles.cardLink}
                to={getUserProfileRoleRoute(props.profile.handle, props.role)}
            />
            <div className={styles.roleHeading}>
                <span>Special Role:</span>
                <strong>{roleTitle}</strong>
                <Tooltip
                    className={styles.roleTooltip}
                    content={props.tooltip}
                    place='top'
                    strategy='fixed'
                    triggerOn='click-hover'
                >
                    <button
                        aria-label={`What is a Topcoder ${roleTitle}?`}
                        className={styles.infoButton}
                        type='button'
                    >
                        <IconOutline.InformationCircleIcon />
                    </button>
                </Tooltip>
            </div>
            <div className={styles.roleCount}>
                <strong>{props.challengeCount.toLocaleString('en-US')}</strong>
                <span>{formatPlural(props.challengeCount, 'Challenge')}</span>
                <IconOutline.ChevronRightIcon className={styles.chevron} />
            </div>
        </div>
    )
}

/**
 * Shows reviewer and copilot summary cards above Member Stats.
 *
 * A single role spans the available width, while two roles share the row and
 * collapse to a vertical stack on narrow profile layouts.
 *
 * This component does not throw.
 *
 * @param {TcSpecialRolesBannerProps} props - Profile and API-backed role totals.
 * @returns {JSX.Element} Special-role cards, or an empty fragment when no roles exist.
 */
const TcSpecialRolesBanner: FC<TcSpecialRolesBannerProps> = props => {
    const roles: SpecialRoleCardConfig[] = []

    if (props.roleStats?.reviewer?.challengeCount) {
        roles.push({
            challengeCount: props.roleStats.reviewer.challengeCount,
            role: 'reviewer',
            tooltip: roleTooltips.reviewer,
        })
    }

    if (props.roleStats?.copilot?.challengeCount) {
        roles.push({
            challengeCount: props.roleStats.copilot.challengeCount,
            role: 'copilot',
            tooltip: roleTooltips.copilot,
        })
    }

    return roles.length === 0 ? <></> : (
        <div className={styles.rolesSection}>
            {roles.map(role => (
                <SpecialRoleCard
                    challengeCount={role.challengeCount}
                    key={role.role}
                    profile={props.profile}
                    role={role.role}
                    tooltip={role.tooltip}
                />
            ))}
        </div>
    )
}

export default TcSpecialRolesBanner
