import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

interface MemberRolesInfoModalProps {
    onClose: () => void
}

const MemberRolesInfoModal: FC<MemberRolesInfoModalProps> = (props: MemberRolesInfoModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title='What are special roles'
    >
        <p>
            Topcoder copilots are skilled project managers and technical experts
            who lead projects on the platform. Topcoder reviewers evaluate solutions
            submitted on the platform to ensure quality and fairness.
        </p>
    </BaseModal>
)

export default MemberRolesInfoModal
