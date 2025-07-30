/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'
import { CopilotApplication } from '~/apps/copilots/src/models/CopilotApplication'

import styles from './styles.module.scss'

interface AlreadyMemberModalProps {
    onClose: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
    copilotApplication: CopilotApplication
    handle?: string
    onApply: () => void
    projectName: string
}

const AlreadyMemberModal: FC<AlreadyMemberModalProps> = props => (
    <BaseModal
        onClose={props.onClose as () => void}
        open
        size='lg'
        title='User already member of the project'
        buttons={(
            <>
                <Button primary onClick={props.onApply} label='Confirm' />
                <Button secondary onClick={props.onClose} label='Cancel' />
            </>
        )}
    >
        <div className={styles.applyCopilotModal}>
            <div className={styles.info}>
                {`The copilot ${props.handle} is part of ${props.projectName} 
                  project with ${props.copilotApplication.existingMembership?.role} role.`}
                <div>Click &apos;Confirm&apos; to accept and complete this opportunity.</div>
            </div>
        </div>
    </BaseModal>
)

export default AlreadyMemberModal
