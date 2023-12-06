import { FC, useState } from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'

import { ArchiveSkillsModal } from './archive-skills-modal'
import { MoveSkillsModal } from './move-skills-modal'
import { ReplaceSkillsModal } from './replace-skills-modal'
import styles from './BulkEditor.module.scss'

interface BulkEditorProps {
    className?: string
}

const BulkEditor: FC<BulkEditorProps> = props => {
    const {
        bulkEditorCtx: context,
        refetchSkills,
        skillsList,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const [showArchive, setShowArchive] = useState(false)
    const [showReplaceSkills, setShowReplaceSkills] = useState(false)
    const [showMoveSkills, setShowMoveSkills] = useState(false)

    function openArchiveModal(): void {
        setShowArchive(true)
    }

    function openMoveSkillsModal(): void {
        setShowMoveSkills(true)
    }

    function openReplaceSkillsModal(): void {
        setShowReplaceSkills(true)
    }

    function closeArchiveModal(archived?: boolean): void {
        if (archived === true) {
            refetchSkills()
            context.toggleAll()
        }

        setShowArchive(false)
    }

    function closeMoveSkillsModal(moved?: boolean): void {
        if (moved === true) {
            refetchSkills()
            context.toggleAll()
        }

        setShowMoveSkills(false)
    }

    function closeReplaceSkillsModal(replaced?: boolean): void {
        if (replaced === true) {
            refetchSkills()
            context.toggleAll()
        }

        setShowReplaceSkills(false)
    }

    const hasSelection = context.selectedSkills.length > 0

    return (
        <div className={classNames(styles.wrap, props.className)}>
            <Button
                primary
                light
                label='Cancel'
                size='lg'
                onClick={function cancel() { context.toggle() }}
            />
            <Button
                secondary
                variant='danger'
                label='Archive selected'
                size='lg'
                disabled={!hasSelection}
                onClick={openArchiveModal}
            />
            <Button
                primary
                label='Replace selected'
                size='lg'
                disabled={!hasSelection}
                onClick={openReplaceSkillsModal}
            />
            <Button
                primary
                label='Move selected'
                size='lg'
                disabled={!hasSelection}
                onClick={openMoveSkillsModal}
            />

            {showArchive && (
                <ArchiveSkillsModal skills={context.selectedSkills} onClose={closeArchiveModal} />
            )}

            {showReplaceSkills && (
                <ReplaceSkillsModal
                    allSkills={skillsList}
                    skills={context.selectedSkills}
                    onClose={closeReplaceSkillsModal}
                />
            )}

            {showMoveSkills && (
                <MoveSkillsModal skills={context.selectedSkills} onClose={closeMoveSkillsModal} />
            )}
        </div>
    )
}

export default BulkEditor
