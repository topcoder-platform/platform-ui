import { FC, useEffect } from 'react'
import { Button } from '../../../lib'
import styles from './Account.module.scss'
import { EnvironmentConfig } from '../../../config'

/**
 * DEPRECTED
 * TODO: Remove after some time, when clear no one links to here...
 */
const Account: FC<{}> = () => {

    // setup auto redirect in 5sec.
    useEffect(() => {
        setTimeout(() => {
            window.location.href = EnvironmentConfig.TOPCODER_URLS.ACC_SETTINGS
        }, 5000)
    }, [])

    return (
        <div className={styles.cards}>

            <h3>This page is obsolete.</h3>
            <Button label='Navigate to Account Settings' url={`${EnvironmentConfig.TOPCODER_URLS.ACC_SETTINGS}`} />
            <p>We will automatically redirect you in 5 seconds...</p>
        </div>
    )
}

export default Account
