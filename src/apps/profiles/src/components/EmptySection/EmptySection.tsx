import { FC, PropsWithChildren } from 'react'
import classNames from 'classnames'

import styles from './EmptySection.module.scss'

interface EmptySectionProps extends PropsWithChildren {
    title?: string
    wide?: boolean
}

const EmptySection: FC<EmptySectionProps> = props => (
    <div className={classNames(styles.wrap, props.wide && 'm-lg')}>
        {props.title && (
            <div className='body-medium-bold'>{props.title}</div>
        )}
        {props.children}
    </div>
)

export default EmptySection
