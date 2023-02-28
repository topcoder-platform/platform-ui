import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { BaseModal, Button } from '../../../../lib'
import { TCACertification } from '../../learn-lib'

import styles from './EnrolledModal.module.scss'

interface EnrolledModalProps {
    isOpen: boolean
    onClose: () => void
}

const EnrolledModal: FC<EnrolledModalProps> = (props: EnrolledModalProps) => {

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        setIsOpen(props.isOpen)
    }, [props.isOpen])

    return (
        <BaseModal
            onClose={props.onClose}
            open={isOpen}
            size='lg'
            classNames={{ modal: styles.enrolledModal, root: styles.modalRoot }}
        >
            <>
                <h2 className='details'>
                    You have successfully enrolled!
                </h2>
                <Button
                    buttonStyle='outline'
                    label='Go to the certification details'
                    size='sm'
                    onClick={props.onClose}
                />
            </>

        </BaseModal>
    )
}

export default EnrolledModal
