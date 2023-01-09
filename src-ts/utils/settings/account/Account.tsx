import { FC, useEffect } from 'react'

import { Button } from '../../../lib'
import { EnvironmentConfig } from '../../../config'

import styles from './Account.module.scss'

/**
 * DEPRECTED
 * TODO: Remove after some time, when clear no one links to here...
 */
const Account: FC<{}> = () => {

    // setup auto redirect in 5sec.
    useEffect(() => {
        setTimeout(() => {
            window.location.href = EnvironmentConfig.TOPCODER_URLS.ACCOUNT_SETTINGS
        }, 5000)
    }, [])

    return (
        <div className={styles.cards}>

            <h3>This page has moved.</h3>
            <Button label='Navigate to Account Settings' url={`${EnvironmentConfig.TOPCODER_URLS.ACCOUNT_PROFILE}`} />
            <p>We will automatically redirect you in 5 seconds...</p>
        </div>
    )
}

export default Account
