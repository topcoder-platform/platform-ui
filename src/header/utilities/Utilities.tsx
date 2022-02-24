import { FC } from 'react'

import styles from './Utilities.module.scss'
import ProfileSelector from './UtilitySelector/ProfileSelector/ProfileSeletor'

// TODO: add props
// tslint:disable-next-line: no-empty-interface
interface UtilitiesProps { }

const Utilities: FC<UtilitiesProps> = () => {
    return (
        <div className={styles.utilities}>
            {/* TODO: make this configurable  */}
            <ProfileSelector />
        </div>
    )
}

export default Utilities
