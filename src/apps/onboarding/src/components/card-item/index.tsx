import React, { FC } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import styles from './styles.module.scss'

interface CardItemProps {
    title: string
    subTitle: string
    description: string
    className?: string
    disabled?: boolean
    onEdit?: () => void
    onDelete?: () => void
}

export const CardItem: FC<CardItemProps> = (props: CardItemProps) => (
    <div className={classNames(props.className, styles.container, 'd-flex flex-column')}>
        <div className='d-flex justify-content-between gap-16 align-items-start'>
            <span className={styles.textTitle}>{props.title}</span>

            <div className={classNames('d-flex align-items-center gap-8', styles.blockBtns)}>
                <button
                    aria-label='edit'
                    type='button'
                    onClick={props.onEdit}
                    disabled={props.disabled}
                    className={styles.btn}
                >
                    <IconOutline.PencilIcon width={24} height={24} />
                </button>
                <button
                    aria-label='delete'
                    type='button'
                    onClick={props.onDelete}
                    disabled={props.disabled}
                    className={styles.btn}
                >
                    <IconOutline.TrashIcon width={24} height={24} />
                </button>
            </div>
        </div>
        <span className={classNames('mt-8', styles.textSubTitle)}>{props.subTitle}</span>
        <span className={styles.textDescription}>{props.description}</span>
    </div>
)

export default CardItem
