/* eslint-disable complexity */

import { FC } from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { UserTrait } from '~/libs/core'
import { getIndustryOptionLabel } from '~/libs/shared'

import styles from './WorkExpirenceCard.module.scss'

interface WorkExpirenceCardProps {
    work: UserTrait
    isModalView?: boolean
    skillNamesMap?: Record<string, string>
    showSkills?: boolean
}

const formatDateRange = (work: UserTrait): string | undefined => {
    const periodFrom: string | Date | undefined = work.timePeriodFrom || work.startDate
    const periodTo: string | Date | undefined = work.timePeriodTo || work.endDate
    const isWorking: boolean = Boolean(work.working)

    if (!periodFrom && !periodTo && !isWorking) {
        return undefined
    }

    const formattedFrom: string = periodFrom ? moment(periodFrom)
        .format('MM/YYYY') : ''
    const formattedTo: string = periodTo
        ? moment(periodTo)
            .format('MM/YYYY')
        : (isWorking ? 'Present' : '')

    if (formattedFrom && formattedTo) {
        return `${formattedFrom} - ${formattedTo}`
    }

    return formattedFrom || formattedTo || undefined
}

const WorkExpirenceCard: FC<WorkExpirenceCardProps> = (props: WorkExpirenceCardProps) => {
    const companyName: string | undefined = props.work.company || props.work.companyName
    const city: string | undefined = props.work.cityTown || props.work.city
    const industry: string | undefined = props.work.industry
    const position: string | undefined = props.work.position
    const dateRange: string | undefined = formatDateRange(props.work)

    const containerClassName: string = classNames(
        styles.workExpirenceCard,
        props.isModalView ? styles.workExpirenceCardModalView : '',
    )

    return (
        <div className={containerClassName}>
            <div className={styles.workExpirenceCardHeader}>
                <div className={styles.workExpirenceCardHeaderLeft}>
                    {(position || industry) && (
                        <p className='body-main-bold'>
                            {position || ''}
                            {
                                position && industry
                                    ? `, ${getIndustryOptionLabel(industry)}`
                                    : (industry ? getIndustryOptionLabel(industry) : '')
                            }
                        </p>
                    )}
                    {(companyName || city) && (
                        <p>
                            {companyName || ''}
                            {companyName && city ? `, ${city}` : (city || '')}
                        </p>
                    )}
                </div>
                {dateRange ? (
                    <div className={styles.workExpirenceCardHeaderRight}>
                        <p>{dateRange}</p>
                    </div>
                ) : undefined}
            </div>
            {props.work.description && (
                <div className={styles.workExpirenceCardDescription}>
                    <p className='body-main-normal'>{props.work.description}</p>
                </div>
            )}
            {
                props.work.associatedSkills
                && Array.isArray(props.work.associatedSkills)
                && props.work.associatedSkills.length > 0
                && props.showSkills
                && (
                    <div className={styles.workExpirenceCardSkills}>
                        <p className='body-main-small-bold'>Skills:</p>
                        <div className={styles.skillsList}>
                            {props.work.associatedSkills.map((skillId: string) => {
                                const skillName = props.skillNamesMap?.[skillId] || skillId
                                return (
                                    <span key={skillId} className={styles.skillTag}>
                                        {skillName}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default WorkExpirenceCard
