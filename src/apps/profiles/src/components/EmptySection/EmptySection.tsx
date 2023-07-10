import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './EmptySection.module.scss'

interface EmptySectionProps {
    children?: ReactNode
    className?: string
    isSelf?: boolean
    selfMessage?: string
    title?: string
    wide?: boolean
}

const EmptySection: FC<EmptySectionProps> = props => (
    <div
        className={
            classNames(
                props.className,
                styles.wrap,
                !props.isSelf && props.children && styles.publicContent,
                props.wide && 'm-lg',
            )
        }
    >
        {props.isSelf
            ? (
                <div className={classNames('body-main', styles.warning)}>
                    {props.selfMessage}
                </div>
            )
            : (
                <>
                    {props.title && (
                        <div className='body-medium-bold'>{props.title}</div>
                    )}
                    {props.children}
                </>
            )}
    </div>
)

export default EmptySection
