/* eslint-disable complexity */

import { FC } from 'react'
import DOMPurify from 'dompurify'
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
            {props.work.description && !props.isModalView && (
                <div className={styles.workExpirenceCardDescription}>
                    <div
                        className='body-main-normal'
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(props.work.description, {
                                ALLOWED_ATTR: [
                                    'href', 'target', 'rel', 'style', 'align',
                                    'border', 'cellpadding', 'cellspacing', 'colspan',
                                    'rowspan', 'width', 'height', 'class',
                                ],
                                ALLOWED_STYLES: {
                                    '*': {
                                        'background-color': true,
                                        color: true,
                                        'font-style': true,
                                        'font-weight': true,
                                        'text-align': true,
                                        'text-decoration': true,
                                    },
                                },
                                ALLOWED_TAGS: [
                                    'p', 'br', 'strong', 'em', 'u', 's', 'strike',
                                    'ul', 'ol', 'li', 'a', 'div', 'span', 'table',
                                    'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
                                ],
                            }),
                        }}
                    />
                </div>
            )}
            {
                props.work.associatedSkills
                && Array.isArray(props.work.associatedSkills)
                && props.work.associatedSkills.length > 0
                && props.showSkills
                && !props.isModalView
                && (
                    <div className={styles.workExpirenceCardSkills}>
                        <p className='body-main-small-bold'>{'Skills: '}</p>
                        <div className={styles.skillsList}>
                            {props
                                .work
                                .associatedSkills
                                .map((skillId: string) => props.skillNamesMap?.[skillId] || skillId)
                                .join(', ')}
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default WorkExpirenceCard
