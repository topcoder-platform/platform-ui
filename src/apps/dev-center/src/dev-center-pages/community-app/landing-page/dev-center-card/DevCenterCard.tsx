import { FC } from 'react'
import classNames from 'classnames'

import styles from './DevCenterCard.module.scss'

interface DevCenterCardProps {
    button?: any
    className?: string
    cornerIcon: any
    description: string
    icon: any
    title: string
    titleClass: string
}

const DevCenterCard: FC<DevCenterCardProps> = props => (
    <div className={classNames(styles.card, props.className)}>
        <div className={styles.cornerImage}>
            {props.cornerIcon}
        </div>
        <div className={styles.cardContainer}>
            {props.icon}
            <div className={styles.titleSection}>
                <h4 className={classNames(styles.title, props.titleClass)}>
                    {props.title}
                </h4>
                <span className={classNames('body-main ', styles.summary)}>
                    {props.description}
                </span>
                {props.button || false}
            </div>
        </div>

    </div>
)

export default DevCenterCard
