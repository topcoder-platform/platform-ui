import { FC } from 'react'

import { HeaderProps } from '../header-props.model'

import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSelector'
import styles from './UtilitySelectors.module.scss'

const UtilitySelectors: FC<HeaderProps> = (props: HeaderProps) => {
    return (
        <div className={styles['utility-selectors']}>
            {/* TODO: make this configurable  */}
            <ProfileSelector initialized={props.initialized} profile={props.profile} />
        </div>
    )
}

export default UtilitySelectors
