import { FC } from 'react'

import {
    IconOutline,
    textFormatDateLocaleShortString,
    textFormatMoneyLocaleString,
} from '~/libs/ui'

import { Work } from '../../../../lib'

import styles from './WorkDetailHighlights.module.scss'

interface WorkDetailHighlightsProps {
    work: Work
}

const WorkDetailHighlights: FC<WorkDetailHighlightsProps> = (props: WorkDetailHighlightsProps) => {

    const highlights: ReadonlyArray<{
        icon: JSX.Element,
        info?: number | string
        name: string
    }> = [
        {
            icon: <IconOutline.CalendarIcon />,
            info: textFormatDateLocaleShortString(props.work.submittedDate),
            name: 'Submitted',
        },
        {
            icon: <IconOutline.CurrencyDollarIcon />,
            info: textFormatMoneyLocaleString(props.work.cost),
            name: 'Cost (USD)',
        },
        {
            icon: <IconOutline.UserGroupIcon />,
            info: props.work.participantsCount,
            name: 'Participants',
        },
        {
            icon: <IconOutline.DocumentTextIcon />,
            info: props.work.solutionsCount,
            name: 'Solutions Received',
        },
        {
            icon: <IconOutline.IdentificationIcon />,
            info: props.work.id,
            name: 'Work id',
        },
    ]

    const higlightElements: Array<JSX.Element> = highlights
        .map((item, index) => (
            <div
                className={styles.highlight}
                key={index as any}
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
