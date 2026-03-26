import { toast } from 'react-toastify'

/**
 * Handles API errors by extracting the most useful message and showing a toast.
 * @param error Axios error-like object.
 */
export const handleError = (error: any): void => {
    let errMessage = error?.data?.message

    if (!errMessage) {
        const errors = error?.response?.data?.errors
        if (Array.isArray(errors)) {
            errMessage = errors.join(',')
        }
    }

    if (!errMessage) {
        errMessage = error?.message
    }

    toast.error(errMessage)
}
