/* eslint-disable complexity */
import { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import classNames from 'classnames'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { IconOutline, Tooltip } from '~/libs/ui'
import { UserSkill, UserSkillWithActivity } from '~/libs/core'

import { isSkillVerified } from '../../services/standard-skills'

import styles from './SkillPill.module.scss'

export interface SkillPillProps {
    children?: ReactNode
    onClick?: (skill: UserSkill) => void
    selected?: boolean
    skill: Partial<Pick<UserSkill, 'id'|'name'|'levels'>>
    theme?: 'dark' | 'verified' | 'presentation' | 'etc' | 'catList'
    fetchSkillDetails?: (skillId: string) => Promise<UserSkillWithActivity>
}

const SkillPill: FC<SkillPillProps> = props => {
    const [hideDetails, setHideDetails] = useState(false)
    const [loadDetails, setLoadDetails] = useState(false)

    const isVerified = useMemo(() => (
        isSkillVerified({ levels: props.skill.levels ?? [] })
    ), [props.skill])

    const className = classNames(
        styles.pill,
        props.onClick && styles.interactive,
        props.selected && styles.selected,
        styles[`theme-${isVerified ? 'verified' : ''}`],
        styles[`theme-${props.theme ?? ''}`],
    )

    const handleMouseEnter = useCallback(() => {
        setLoadDetails(true)
    }, [])

    const handleClick = useCallback(() => props.onClick?.call(undefined, props.skill as UserSkill), [
        props.onClick, props.skill,
    ])

    const { data: skillDetails, isValidating: isLoadingDetails }: SWRResponse<UserSkillWithActivity>
        = useSWR<UserSkillWithActivity>(
            loadDetails
            && props.fetchSkillDetails
            && props.skill?.id ? `user-skill-activity/${props.skill.id}` : undefined,
            () => props.fetchSkillDetails!(props.skill.id!)
                .catch(() => {
                    setHideDetails(true)
                    return {} as any
                }),
        )

    const skillDetailsTooltipContent = useMemo(() => {
        if (!skillDetails || isLoadingDetails || hideDetails) {
            return 'Loading...'
        }

        if (!skillDetails.lastUsedDate && !skillDetails.activity) {
            return ''
        }

        return (
            <>
                <div className={styles.tooltipRow}>
                    <strong>Last activity:</strong>
                    <span>{format(new Date(skillDetails.lastUsedDate), 'MMM dd, yyyy')}</span>
                </div>
                <ul className={styles.tooltipDetails}>
                    {skillDetails.activity.challenge && Object.keys(skillDetails.activity.challenge)
                        .map(role => (
                            <li key={role}>
                                <div className={styles.tooltipRow}>
                                    Challenges -
                                    {' '}
                                    {role}
                                    {' '}
                                    (
                                    {skillDetails.activity.challenge![role].count}
                                    ):
                                </div>
                                {skillDetails.activity.challenge![role].lastSources.map(s => (
                                    <a
                                        key={s.id}
                                        className={classNames(styles.tooltipRow, styles.padLeft)}
                                        href={`${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${s.id}`}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        {s.name}
                                    </a>
                                ))}
                            </li>
                        ))}
                    {skillDetails.activity.course && (
                        <li>
                            <div className={styles.tooltipRow}>
                                Courses (
                                {skillDetails.activity.course.count}
                                ):
                            </div>
                            {skillDetails.activity.course.lastSources.map(s => (
                                <a
                                    key={s.completionEventId}
                                    className={classNames(styles.tooltipRow, styles.padLeft)}
                                    href={`${EnvironmentConfig.URLS.ACADEMY_COURSE}/${s.certification}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    {s.title}
                                </a>
                            ))}
                        </li>
                    )}
                    {skillDetails.activity.certification && (
                        <li>
                            <div className={styles.tooltipRow}>
                                TCA Certifications (
                                {skillDetails.activity.certification.count}
                                ):
                            </div>
                            {skillDetails.activity.certification.lastSources.map(s => (
                                <a
                                    key={s.completionEventId}
                                    className={classNames(styles.tooltipRow, styles.padLeft)}
                                    href={`${EnvironmentConfig.URLS.ACADEMY_CERTIFICATION}/${s.dashedName}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    {s.title}
                                </a>
                            ))}
                        </li>
                    )}
                    {skillDetails.activity.engagement && (
                        <li>
                            <div className={styles.tooltipRow}>
                                Engagements (
                                {skillDetails.activity.engagement.count}
                                ):
                            </div>
                            {skillDetails.activity.engagement.lastSources.map(s => (
                                <a
                                    key={s.id}
                                    className={classNames(styles.tooltipRow, styles.padLeft)}
                                    href={`${EnvironmentConfig.ENGAGEMENTS_URL}/${s.id}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    {s.title}
                                </a>
                            ))}
                        </li>
                    )}
                </ul>
            </>
        )
    }, [skillDetails, isLoadingDetails, hideDetails])

    return (
        <div
            className={className}
            onClick={handleClick}
        >
            <span className={classNames('body-main', styles.text)}>
                {props.skill.name}
                {props.children}
            </span>
            {isVerified && props.fetchSkillDetails && !hideDetails && (
                <Tooltip
                    clickable
                    content={isLoadingDetails ? 'Loading...' : skillDetailsTooltipContent}
                >
                    <IconOutline.CheckCircleIcon onMouseEnter={handleMouseEnter} />
                </Tooltip>
            )}
            {isVerified && (!props.fetchSkillDetails || hideDetails) && (
                <IconOutline.CheckCircleIcon />
            )}
        </div>
    )
}

export default SkillPill
