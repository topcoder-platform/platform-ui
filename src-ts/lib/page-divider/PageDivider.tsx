import { FC } from 'react'
import cn from 'classnames'

import styles from './PageDivider.module.scss'

interface PageDividerProps {
    styleNames?: Array<string>
}

const PageDivider: FC<PageDividerProps> = (props: PageDividerProps) => {

    const additionalStyles: Array<string> = (props.styleNames ?? []).map(style => styles[style])

    return <div className={cn('page-divider', styles.divider, ...additionalStyles)} />
}

export default PageDivider
