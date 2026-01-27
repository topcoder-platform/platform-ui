import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, IconSolid } from '~/libs/ui'
import { CopyButton } from '~/apps/admin/src/lib/components/CopyButton'

import styles from './PhoneCard.module.scss'

interface PhoneCardProps {
    type: string
    number: string
    isModalView?: boolean
    canEdit?: boolean
    onEdit?: () => void
    phoneIndex?: number
}

const PhoneCard: FC<PhoneCardProps> = (props: PhoneCardProps) => {
    const containerClassName: string = classNames(
        styles.phoneCard,
        props.isModalView ? styles.phoneCardModalView : '',
    )

    return (
        <div className={containerClassName}>
            <div className={styles.phoneCardContent}>
                <div
                    className={classNames(
                        styles.phoneCardLeft,
                        props.phoneIndex !== 0 ? styles.phoneCardNotFirst : '',
                    )}
                >
                    {
                        props.phoneIndex === 0 && (
                            <div className={styles.phoneIcon}>
                                <IconSolid.PhoneIcon />
                            </div>
                        )
                    }
                    <div className={styles.phoneInfo}>
                        {props.isModalView && (
                            <span className={styles.phoneType}>{props.type}</span>
                        )}
                        <span className={styles.phoneNumber}>{props.number}</span>
                    </div>
                    <CopyButton className={styles.copyButton} text={props.number} />
                </div>
                <div className={styles.phoneCardRight}>
                    {props.canEdit && !props.isModalView && props.onEdit && (
                        <Button
                            className={styles.editButton}
                            icon={IconOutline.PencilIcon}
                            onClick={props.onEdit}
                            size='lg'
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PhoneCard
