import React from 'react'

import styles from './Chip.module.scss'

interface ChipProps {
    text: string
}

const Chip: React.FC<ChipProps> = (props: ChipProps) => <div className={styles.container}>{props.text}</div>

export default Chip
