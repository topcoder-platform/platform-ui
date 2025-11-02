import { FC } from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { UserTrait } from '~/libs/core'
import { getIndustryOptionLabel } from '~/libs/shared'

import styles from './WorkExpirenceCard.module.scss'

interface WorkExpirenceCardProps {
    work: UserTrait
    isModalView?: boolean
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
    const dateRange: string | undefined = formatDateRange(props.work)

    const containerClassName: string = classNames(
        styles.workExpirenceCard,
        props.isModalView ? styles.workExpirenceCardModalView : '',
    )

    return (
        <div className={containerClassName}>
            <div className={styles.workExpirenceCardHeader}>
                <div className={styles.workExpirenceCardHeaderLeft}>
                    <p className='body-main-bold'>
                        {props.work.position}
                        {industry ? `, ${getIndustryOptionLabel(industry)}` : undefined}
                    </p>
                    {(companyName || city) && (
                        <p>
                            {companyName}
                            {city ? `, ${city}` : undefined}
                        </p>
                    )}
                </div>
                {dateRange ? (
                    <div className={styles.workExpirenceCardHeaderRight}>
                        <p>{dateRange}</p>
                    </div>
                ) : undefined}
            </div>
        </div>
    )
}

export default WorkExpirenceCard
