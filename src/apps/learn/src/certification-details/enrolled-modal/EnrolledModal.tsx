import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'

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
            size='sm'
            classNames={{ modal: styles.enrolledModal, root: styles.modalRoot }}
        >
            <>
                <h2 className='details'>
                    You have successfully enrolled!
                </h2>
                <Button
                    secondary
                    light
                    label='Go to the certification details'
                    size='md'
                    onClick={props.onClose}
                />
            </>

        </BaseModal>
    )
}

export default EnrolledModal
