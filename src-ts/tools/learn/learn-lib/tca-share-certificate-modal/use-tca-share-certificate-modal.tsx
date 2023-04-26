import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import { noop } from 'lodash'

import TCAShareCertificateModal from './TCAShareCertificateModal'

export interface TCAShareCertificateModalData {
    hide: () => void
    modal: ReactNode
    show: () => void
}

export function useTCAShareCertificateModal(shareUrl: string, onClose: () => void = noop):
TCAShareCertificateModalData {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleClose(): void {
        setIsOpen(false)
        onClose()
    }

    return {
        hide: handleClose,
        modal: (
            <TCAShareCertificateModal
                shareUrl={shareUrl}
                open={isOpen}
                onClose={handleClose}
            />
        ),
        show() { setIsOpen(true) },
    }
}
