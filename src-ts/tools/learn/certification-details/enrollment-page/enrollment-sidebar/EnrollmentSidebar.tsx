import { FC } from 'react'
import classNames from 'classnames'

import { UserProfile } from '../../../../../lib'
import { StickySidebar } from '../../../learn-lib'
import { EnrollmentForm } from '../enrollment-form'

import styles from './EnrollmentSidebar.module.scss'

interface EnrollmentSidebarProps {
    onEnroll: (d: {email: string}) => Promise<void>
    profile?: UserProfile
}

const EnrollmentSidebar: FC<EnrollmentSidebarProps> = (props: EnrollmentSidebarProps) => (
    <StickySidebar className={styles.wrap}>
        <div className={styles.header}>
            <h3 className='marketing'>Free</h3>
            <span className='strike'>$20</span>
            <strong className='overline'>Total payment</strong>
        </div>
        <hr />
        <div className={classNames('body-ultra-small-bold', styles.formTitle)}>
            Contact Information
        </div>
        <div className={styles.form}>
            <EnrollmentForm profile={props.profile} onSubmit={props.onEnroll}>
                <div className={styles.noPaymentBanner}>
                    <h3 className='details'>No payment required</h3>
                    <div className='body-medium'>
                        Enroll until March 31 with no cost.
                    </div>
                </div>
            </EnrollmentForm>
        </div>
    </StickySidebar>
)

export default EnrollmentSidebar
