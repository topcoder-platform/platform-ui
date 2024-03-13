import { FC } from 'react'
import classNames from 'classnames'

import styles from './SettingSection.module.scss'

interface SettingSectionProps {
    containerClassName?: string
    readonly title: string
    readonly infoText?: string
    actionElement?: React.ReactNode
    leftElement?: React.ReactNode
}

const SettingSection: FC<SettingSectionProps> = (props: SettingSectionProps) => (
    <div className={classNames(styles.container, props.containerClassName)}>
        {props.leftElement}

        <div className={styles.contentMiddle}>
            <p className='body-main-bold'>{props.title}</p>
            <p
                className={styles.infoText}
                dangerouslySetInnerHTML={{ __html: props.infoText || '' }}
            />
        </div>

        {props.actionElement}
    </div>
)

export default SettingSection
