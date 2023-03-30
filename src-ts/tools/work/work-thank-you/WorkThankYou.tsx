import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '../../../lib'
import { selfServiceRootRoute } from '../work.routes'

import styles from './WorkThankYou.module.scss'

const WorkThankYou: () => JSX.Element = () => {

    const navigate: NavigateFunction = useNavigate()

    const clearPreviousForm: () => void = () => {
        // TODO in PROD-2441 - Whichever form clearing mechanism is coded in PROD-2441 should be called here.
    }

    function onDone(): void {
        navigate(selfServiceRootRoute)
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
                    <Button
                        label='Go to Dashboard'
                        onClick={onDone}
                    />
                </div>
            </div>
        </>
    )
}

export default WorkThankYou
