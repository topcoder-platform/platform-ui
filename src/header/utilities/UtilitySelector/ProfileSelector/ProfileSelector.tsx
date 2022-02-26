import classNames from 'classnames'
import { Component } from 'react'

import Avatar from '../../../../lib/avatar/Avatar'
import { BaseProps } from '../../../../lib/interfaces'
import '../../../../lib/styles/index.scss'
import { UiRoute } from '../../../../lib/urls'

import styles from './ProfileSelector.module.scss'

class ProfileSelector extends Component<BaseProps> {

    private readonly buttonClass: string = 'button'
    private readonly routes: UiRoute = new UiRoute()

    private get avatar(): JSX.Element { return <Avatar profile={this.props.profile} /> }
    private get logIn(): JSX.Element { return <a href={this.routes.login} className={this.buttonClass}>Log In</a> }
    private get signUp(): JSX.Element { return <a href={this.routes.signup} className={classNames(this.buttonClass, 'allWhite')}>Sign Up</a> }

    render(): JSX.Element {

        // if we're not initialized, don't render anything
        if (!this.props.initialized) {
            return <></>
        }

        const isLoggedIn: boolean = !!this.props.profile
        return (
            <div className={styles['profile-selector']}>
                {!isLoggedIn && this.logIn}
                {!isLoggedIn && this.signUp}
                {isLoggedIn && this.avatar}
            </div>
        )
    }
}

export default ProfileSelector
