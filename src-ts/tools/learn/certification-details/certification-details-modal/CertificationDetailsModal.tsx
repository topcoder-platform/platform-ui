import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { BaseModal, Button } from '../../../../lib'
import { TCACertification } from '../../learn-lib'

import { CertifDetailsContent } from './certif-details-content'

interface CertificationDetailsModalProps {
    certification: TCACertification
    isOpen: boolean
    onClose: () => void
}

const CertificationDetailsModal: FC<CertificationDetailsModalProps> = (props: CertificationDetailsModalProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        setIsOpen(props.isOpen)
    }, [props.isOpen])

    return (
        <BaseModal
            onClose={props.onClose}
            open={isOpen}
            size='body'
            title={props.certification.title}
            buttons={(
                <Button
                    buttonStyle='primary'
                    label='Close'
                    onClick={props.onClose}
                />
            )}
        >
            <CertifDetailsContent certification={props.certification} />
        </BaseModal>
    )
}

export default CertificationDetailsModal
