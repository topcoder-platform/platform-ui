import { FC } from 'react'
import classNames from 'classnames'

import styles from './DevCenterTag.module.scss'

interface TagProps {
    text: string
}

const DevCenterTag: FC<TagProps> = ({ text }) => (
    <div className={styles.tag}>
        <span className={classNames('font-tc-white', 'label', styles.text)}>{text}</span>
    </div>
)

export default DevCenterTag
