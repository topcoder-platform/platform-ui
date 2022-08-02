import { Link } from 'react-router-dom'
import { toast, ToastContent } from 'react-toastify'

import { contactSupportPath } from '../../contact-support-form'
import { logError } from '../logging-functions'

export function handle(error: any, errString?: string): void {

    logError(error)

    const errorContent: ToastContent = (
        <>
            <p>
                {errString ?? error.response?.data?.result?.content ?? error.message ?? error}
                {' '}
                Please try again later or
                {' '}
                <Link
                    className='font-link-blue-dark'
                    to={contactSupportPath}
                >
                    Contact Support
                </Link>.
            </p>
        </>
    )

    toast.error(errorContent)
}
