import { FC } from 'react'

import { Button, UserProfile } from '../../../../../lib'
import { StickySidebar } from '../../../learn-lib'

import styles from './EnrollmentSidebar.module.scss'

interface EnrollmentSidebarProps {
    onEnroll: (d: {email: string}) => Promise<void>
    profile?: UserProfile
}

const EnrollmentSidebar: FC<EnrollmentSidebarProps> = (props: EnrollmentSidebarProps) => (
    <StickySidebar className={styles.wrap}>
        <div className={styles.header}>
            <div className={styles.freeLabel}>FREE</div>
            <span className='strike'>$20</span>
        </div>
        <hr />
        <div className={styles.form}>
            <div className={styles.noPaymentBanner}>
                <h3 className='details'>No payment required</h3>
                <div className='body-medium'>
                    Enroll until April 30 with no cost.
                </div>
            </div>
            <Button buttonStyle='primary' onClick={props.onEnroll} label='Enroll Now' size='lg' />
            {/* TODO: this form will probably be re-used when we add actuall payments, leaving this here for now */}
            {/* <EnrollmentForm profile={props.profile} onSubmit={props.onEnroll}>
            </EnrollmentForm> */}
        </div>
    </StickySidebar>
)

export default EnrollmentSidebar
