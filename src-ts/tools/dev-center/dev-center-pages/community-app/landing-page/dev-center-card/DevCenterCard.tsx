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

const DevCenterCard: FC<DevCenterCardProps> = ({ icon, cornerIcon, title, titleClass, description, button, className = '' }) => (
    <div className={classNames(styles.card, className)}>
        <div className={styles.cornerImage}>{cornerIcon}</div>
        <div className={styles.cardContainer}>
            {icon}
            <div className={styles.titleSection}>
                <h4 className={classNames(styles.title, titleClass)}>{title}</h4>
                <span className={classNames('body-main ', styles.summary)}>{description}</span>
                {button && button}
            </div>
        </div>

    </div>
)

export default DevCenterCard
