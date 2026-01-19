import { FC } from 'react'
import classNames from 'classnames'

import { CopyButton } from '~/apps/admin/src/lib/components/CopyButton'

import styles from './PhoneCard.module.scss'

interface PhoneCardProps {
    type: string
    number: string
    isModalView?: boolean
}

const PhoneCard: FC<PhoneCardProps> = (props: PhoneCardProps) => {
    const containerClassName: string = classNames(
        styles.phoneCard,
        props.isModalView ? styles.phoneCardModalView : '',
    )

    return (
        <div className={containerClassName}>
            <div className={styles.phoneCardContent}>
                <div className={styles.phoneCardLeft}>
                    <div className={styles.phoneIcon}>📞</div>
                    <div className={styles.phoneInfo}>
                        <span className={styles.phoneType}>{props.type}</span>
                        <span className={styles.phoneNumber}>{props.number}</span>
                    </div>
                </div>
                <CopyButton className={styles.copyButton} text={props.number} />
            </div>
        </div>
    )
}

export default PhoneCard

