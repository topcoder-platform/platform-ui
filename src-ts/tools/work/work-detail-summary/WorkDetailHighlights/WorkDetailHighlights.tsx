import { FC } from 'react'

import {
    IconOutline,
    textFormatDateLocaleShortString,
    textFormatMoneyLocaleString,
} from '../../../../lib'
import { Work } from '../../work-lib'

import styles from './WorkDetailHighlights.module.scss'

interface WorkDetailHighlightsProps {
    work: Work
}

const WorkDetailHighlights: FC<WorkDetailHighlightsProps> = (props: WorkDetailHighlightsProps) => {

    const { work }: WorkDetailHighlightsProps = props

    const highlights: ReadonlyArray<{
        icon: JSX.Element,
        info?: number | string
        name: string
    }> = [
        {
            icon: <IconOutline.CalendarIcon />,
            info: textFormatDateLocaleShortString(work.submittedDate),
            name: 'Submitted',
        },
        {
            icon: <IconOutline.CurrencyDollarIcon />,
            info: textFormatMoneyLocaleString(work.cost),
            name: 'Cost (USD)',
        },
        {
            icon: <IconOutline.UserGroupIcon />,
            info: work.participantsCount,
            name: 'Participants',
        },
        {
            icon: <IconOutline.DocumentTextIcon />,
            info: work.solutionsCount,
            name: 'Solutions Received',
        },
        {
            icon: <IconOutline.IdentificationIcon />,
            info: work.id,
            name: 'Work id',
        },
    ]

    const higlightElements: Array<JSX.Element> = highlights
        .map((item, index) => (
            <div
                className={styles.highlight}
                key={index}
            >

                <div className={styles.icon}>
                    {item.icon}
                </div>

                <h4>{item.name}</h4>

                <p className={styles.info}>
                    {item.info}
                </p>
            </div>
        ))

    return (
        <div className={styles['highlights-container']}>
            {higlightElements}
        </div>
    )
}

export default WorkDetailHighlights
