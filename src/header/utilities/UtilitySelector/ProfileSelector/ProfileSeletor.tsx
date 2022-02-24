import classNames from 'classnames'
import { FC } from 'react'

import '../../../../lib/styles/index.scss'
import { UiRoute } from '../../../../lib/urls'

import styles from './ProfileSelector.module.scss'

const ProfileSelector: FC<{}> = () => {

    const routes: UiRoute = new UiRoute()
    return (
        <div className={styles['profile-selector']}>
            <a href={routes.login} className='button'>
                Log In
            </a>
            <a href={routes.signup} className={classNames('button', 'allWhite')}>
                Sign Up
            </a>
        </div>
    )
}

export default ProfileSelector
