import { FC, PropsWithChildren } from 'react'
import cn from 'classnames'

import styles from './Display.module.scss'

export interface DisplayProps {
    visible: boolean
}

const Display: FC<PropsWithChildren<DisplayProps>> = props => (
    <div className={cn(styles.display, { [styles.hidden]: !props.visible })}>
        {props.children}
    </div>
)

export default Display
