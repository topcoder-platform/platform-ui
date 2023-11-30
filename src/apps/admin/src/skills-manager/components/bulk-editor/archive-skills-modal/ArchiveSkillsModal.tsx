import { FC, useState } from 'react'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import { SkillsList } from '../../skills-list'
import { bulkArchiveStandardizedSkills, StandardizedSkill } from '../../../services'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../../context'

import styles from './ArchiveSkillsModal.module.scss'

interface ArchiveSkillsModalProps {
    skills: StandardizedSkill[]
    onClose: (archived?: boolean) => void
}

const ArchiveSkillsModal: FC<ArchiveSkillsModalProps> = props => {
    const [isLoading, setIsLoading] = useState(false)

    const { bulkEditorCtx: context }: SkillsManagerContextValue = useSkillsManagerContext()

    async function archiveAll(): Promise<void> {
        setIsLoading(true)
        await bulkArchiveStandardizedSkills(props.skills)
        props.onClose(true)
        setIsLoading(false)
    }

    function close(): void {
        props.onClose()
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Archive Skills'
            bodyClassName={styles.modalBody}
            buttons={(
                <>
                    <Button primary light label='Cancel' onClick={close} size='lg' />
                    <Button primary variant='danger' label='Archive' onClick={archiveAll} size='lg' />
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
            <LoadingSpinner hide={!isLoading} overlay />
        </BaseModal>
    )
}

export default ArchiveSkillsModal
