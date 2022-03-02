import { FC } from 'react'

import { HeaderProps } from '../models'

import styles from './UtilitySelections.module.scss'
import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSelector'

const UtilitySelections: FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <div className={styles['utility-selections']}>
            {/* TODO: make this configurable  */}
            <ProfileSelector initialized={props.initialized} profile={props.profile} />
        </div>
    )
}

export default UtilitySelections
