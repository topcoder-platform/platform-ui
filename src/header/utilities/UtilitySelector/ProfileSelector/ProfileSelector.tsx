import classNames from 'classnames'
import { Component } from 'react'
import { Link } from 'react-router-dom'

import { Avatar, ExternalEndpoint, HeaderProps, UiRoute } from '../../../../lib'
import '../../../../lib/styles/index.scss'

import styles from './ProfileSelector.module.scss'

class ProfileSelector extends Component<HeaderProps> {

    private readonly buttonClass: string = 'button'
    private readonly externalEndpoints: ExternalEndpoint = new ExternalEndpoint()
    private readonly routes: UiRoute = new UiRoute()

    private get avatar(): JSX.Element {
        return <Avatar profile={this.props.profile} />
    }
    private get logIn(): JSX.Element {
        return <Link to={this.externalEndpoints.login(this.routes.home)} className={this.buttonClass}>
            Log In
        </Link>
    }
    private get signUp(): JSX.Element {
        return <Link to={this.externalEndpoints.signup(this.routes.home)} className={classNames(this.buttonClass, 'allWhite')}>
            Sign Up
        </Link>
    }

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
