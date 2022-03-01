import { FC } from 'react'

import { BaseProps } from '../../lib/interfaces'

import styles from './Utilities.module.scss'
import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSelector'

const Utilities: FC<BaseProps> = (props: BaseProps) => {

    return (
        <div className={styles.utilities}>
            {/* TODO: make this configurable  */}
            <ProfileSelector initialized={props.initialized} profile={props.profile} />
        </div>
    )
}

export default Utilities
