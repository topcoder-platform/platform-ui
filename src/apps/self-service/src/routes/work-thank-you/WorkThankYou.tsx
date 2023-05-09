import { LinkButton } from '~/libs/ui'

import { workDashboardRoute } from '../../config'

import styles from './WorkThankYou.module.scss'

const WorkThankYou: () => JSX.Element = () => {

    const clearPreviousForm: () => void = () => {
        // TODO in PROD-2441 - Whichever form clearing mechanism is coded in PROD-2441 should be called here.
    }

    clearPreviousForm()

    return (
        <>
            <div className={styles.container}>
                <div className='body-main'>
                    <h2>THANK YOU</h2>

                    <div className={styles.contentContainer}>
                        <p>Your payment has been processed successfully.</p>

                        <p>
                            You can now go to the Dashboard to manage the work you&apos;ve
                            submitted.
                        </p>

                        <p>
                            If your changes do not appear immediately, please reload the
                            page.
                        </p>
                    </div>
                    <LinkButton
                        primary
                        size='lg'
                        label='Go to Dashboard'
                        to={workDashboardRoute}
                    />
                </div>
            </div>
        </>
    )
}

export default WorkThankYou
