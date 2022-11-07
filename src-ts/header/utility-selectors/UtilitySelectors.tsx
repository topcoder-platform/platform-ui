import { FC } from 'react'

import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSelector'
import styles from './UtilitySelectors.module.scss'

const UtilitySelectors: FC<{}> = () => (
    <div className={styles['utility-selectors']}>
        {/* TODO: make this configurable  */}
        <ProfileSelector />
    </div>
)

export default UtilitySelectors
