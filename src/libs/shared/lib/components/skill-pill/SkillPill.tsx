import { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'
import useSWR, { SWRResponse } from 'swr'
import { format } from 'date-fns'


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
      setLoadDetails(true);
    }, []);

    const handleClick = useCallback(() => props.onClick?.call(undefined, props.skill as UserSkill), [
        props.onClick, props.skill,
    ])

    const { data: skillDetails, isValidating: isLoadingDetails } = useSWR<UserSkillWithActivity>(
        loadDetails &&
        props.fetchSkillDetails
        && props.skill?.id ? `user-skill-activity/${props.skill.id}` : null,
        () => props.fetchSkillDetails!(props.skill.id!).catch((e) => {
            setHideDetails(true)
            return {} as any
        })
    )

    const skillDetailsTooltipContent = useMemo(() => {
        if (!skillDetails || isLoadingDetails || hideDetails) {
            return 'Loading...'
        }

        return (
            <>
                <div className={styles.tootltipRow}>
                    <strong>Last used:</strong>
                    <span>{format(new Date(skillDetails.lastUsedDate), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <ul className={styles.tooltipDetails}>
                    {skillDetails.activity.challenge && (
                        <li>
                            <div className={styles.tootltipRow}>
                                Challenges ({skillDetails.activity.challenge.count}):
                            </div>
                            {skillDetails.activity.challenge.lastSources.map(s => (
                                <a key={s.id} className={classNames(styles.tootltipRow, styles.padLeft)} href={`https://topcoder-dev.com/challenges/${s.id}`} target='blank'>
                                    {s.name}
                                </a>
                            ))}
                        </li>
                    )}
                    {skillDetails.activity.course && (
                        <li>
                            <div className={styles.tootltipRow}>
                                Courses ({skillDetails.activity.course.count}):
                            </div>
                            {skillDetails.activity.course.lastSources.map(s => (
                                <a key={s.completionEventId} className={classNames(styles.tootltipRow, styles.padLeft)} href={`https://academy.topcoder-dev.com/freeCodeCamp/${s.certification}`} target='blank'>
                                    {s.title}
                                </a>
                            ))}
                        </li>
                    )}
                    {skillDetails.activity.certification && (
                        <li>
                            <div className={styles.tootltipRow}>
                                TCA Certifications ({skillDetails.activity.certification.count}):
                            </div>
                            {skillDetails.activity.certification.lastSources.map(s => (
                                <a key={s.completionEventId} className={classNames(styles.tootltipRow, styles.padLeft)} href={`https://academy.topcoder-dev.com/tca-certifications/${s.dashedName}`} target='blank'>
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
