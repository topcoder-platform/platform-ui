import { Dispatch, FC, SetStateAction, useEffect } from 'react'

import { BaseModal, Button, useLocalStorage } from '../../../../lib'
import { TCACertification } from '../data-providers'
import { getTCACertificateUrl } from '../../learn.routes'

import styles from './TCACertificationCompletedModal.module.scss'

interface TCACertificationCompletedModalProps {
    certification: TCACertification
    isOpen: boolean
}

const TCACertificationCompletedModal: FC<TCACertificationCompletedModalProps>
= (props: TCACertificationCompletedModalProps) => {

    const storeKey: string = props.certification?.dashedName && `tca-cert-completed[${props.certification.dashedName}]`

    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useLocalStorage<boolean>(storeKey, false)

    function handleClick(): void {
        handleClose()
        window.open(getTCACertificateUrl(props.certification.dashedName), '_blank')
    }

    function handleClose(): void {
        setIsOpen(false)
    }

    useEffect(() => {
        if (!storeKey || localStorage.getItem(storeKey) !== null) {
            return
        }

        setIsOpen(props.isOpen)
    }, [props.isOpen, setIsOpen, storeKey])

    return (
        <BaseModal
            onClose={handleClose}
            open={isOpen}
            size='sm'
            classNames={{ modal: styles.completedModal, root: styles.modalRoot }}
        >
            <>
                <h2 className='details'>
                    You have successfully completed the
                    {' '}
                    {props.certification.title}
                    !
                </h2>
                <Button buttonStyle='outline' label='Check it out now!' onClick={handleClick} />
            </>

        </BaseModal>
    )
}

export default TCACertificationCompletedModal
