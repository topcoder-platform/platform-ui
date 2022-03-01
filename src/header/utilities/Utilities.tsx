import { FC } from 'react'

import { HeaderProps } from '../../lib'

import styles from './Utilities.module.scss'
import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSelector'

const Utilities: FC<HeaderProps> = (props: HeaderProps) => {

    return (
        <div className={styles.utilities}>
            {/* TODO: make this configurable  */}
            <ProfileSelector initialized={props.initialized} profile={props.profile} />
        </div>
    )
}

export default Utilities
