import { FC } from 'react'
import classNames from 'classnames'

import styles from './PageDivider.module.scss'

interface PageDividerProps {
    className?: string
    smMargins?: boolean
}

const PageDivider: FC<PageDividerProps> = (props: PageDividerProps) => {
    const className: string = classNames(
        props.className,
        'page-divider',
        styles.divider,
        props.smMargins && styles.spacingSmall,
    )

    return <div className={className} />
}

export default PageDivider
