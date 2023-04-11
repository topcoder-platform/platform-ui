import { FC } from 'react'
import classNames from 'classnames'

import styles from './DevCenterTag.module.scss'

interface TagProps {
    text: string
}

const DevCenterTag: FC<TagProps> = props => (
    <div className={styles.tag}>
        <span className={classNames('font-tc-white', 'label', styles.text)}>
            {props.text}
        </span>
    </div>
)

export default DevCenterTag
