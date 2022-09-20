import { FC } from 'react'

import { BaseModal } from '../../../../../lib'

export interface BadgeCreatedModalProps {
    isOpen: boolean
    onClose: () => void
}

const BadgeCreatedModal: FC<BadgeCreatedModalProps> = (props: BadgeCreatedModalProps) => {

    function onClose(): void {
        props.onClose()
    }

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title={`Badge created`}
        >

        </BaseModal>
    )
}

export default BadgeCreatedModal
