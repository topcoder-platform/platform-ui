import { noop } from 'lodash'
import { ReactNode, useCallback, useState } from 'react'

import OtpModal from './OtpModal'

export const useOtpModal = (email: string): [
    ReactNode,
    (error?: string) => Promise<boolean | string>,
  ] => {
    const [isVisible, setIsVisible] = useState(false)
    const [error, setError] = useState<string>()
    const [resolvePromise, setResolvePromise] = useState<(value?: boolean | string) => void
        >(() => noop)

    const collectOtpCode = useCallback(
        (errorMessage?: string) => {
            setIsVisible(true)
            setError(errorMessage)

            return new Promise<boolean | string>(resolve => {
                setResolvePromise(() => resolve)
            })
        },
        [],
    )

    const handleCodeEntered = useCallback((code: string) => {
        setIsVisible(false)
        resolvePromise(code)
    }, [resolvePromise])

    const handleClose = useCallback(() => {
        setIsVisible(false)
        resolvePromise()
    }, [resolvePromise])

    const modal = isVisible ? (
        <OtpModal
            isOpen
            userEmail={email}
            onOtpEntered={handleCodeEntered}
            onClose={handleClose}
            error={error}
        />
    ) : <></>

    return [modal, collectOtpCode]
}
