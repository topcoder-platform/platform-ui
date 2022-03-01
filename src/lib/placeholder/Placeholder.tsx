import { FC } from 'react'

import styles from './Placeholder.module.scss'

export interface PlaceholderProps {
    title?: string
}

const Placeholder: FC<PlaceholderProps> = (props: PlaceholderProps) => (
    <div className={styles.placeholder} data-testid={props.title}>
        {props.title}
    </div>
)

export default Placeholder
