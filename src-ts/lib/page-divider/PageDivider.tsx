import cn from 'classnames'
import { FC } from 'react'

import styles from './PageDivider.module.scss'

interface PageDividerProps {
    styleNames?: Array<string>
}

const PageDivider: FC<PageDividerProps> = ({ styleNames = [] }) => {

    const additionalStyles: Array<{ [key: string]: any }> = styleNames.map((style) => styles[style])

    return <div className={cn(styles.divider, ...additionalStyles)} />
}

export default PageDivider
