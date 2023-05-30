import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

interface DiceSetupModalProps {
    onClose: () => void
}

const DiceSetupModal: FC<DiceSetupModalProps> = (props: DiceSetupModalProps) => (
    <BaseModal
        open
        onClose={props.onClose}
        title='DICE ID AUTHENTICATOR SETUP'
        size='body'
    />
)

export default DiceSetupModal
