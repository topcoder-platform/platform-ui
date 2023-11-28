import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { StandardizedSkill } from '../../../services'
import { SkillsList } from '../../skills-list'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../../context'

import styles from './ArchiveSkillsModal.module.scss'

interface ArchiveSkillsModalProps {
    skills: StandardizedSkill[]
    onClose: () => void
}

const ArchiveSkillsModal: FC<ArchiveSkillsModalProps> = props => {
    const { bulkEditorCtx: context }: SkillsManagerContextValue = useSkillsManagerContext()

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Archive Skills'
            bodyClassName={styles.modalBody}
            buttons={(
                <>
                    <Button primary light label='Cancel' onClick={props.onClose} />
                    <Button primary variant='danger' label='Archive' onClick={props.onClose} />
                </>
            )}
        >
            <SkillsList
                className={styles.skillsList}
                skills={props.skills}
                onSelect={context.toggleSkill}
                isSelected={context.isSkillSelected}
                editMode={!!context.isEditing}
            />
            {/* <LoadingSpinner hide={!loading} overlay /> */}
        </BaseModal>
    )
}

export default ArchiveSkillsModal
