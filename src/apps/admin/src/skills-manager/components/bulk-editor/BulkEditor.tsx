import { FC, useState } from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'

import { ArchiveSkillsModal } from './archive-skills-modal'
import { MoveSkillsModal } from './move-skills-modal'
import styles from './BulkEditor.module.scss'

interface BulkEditorProps {
    className?: string
}

const BulkEditor: FC<BulkEditorProps> = props => {
    const {
        bulkEditorCtx: context,
        refetchSkills,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const [showArchive, setShowArchive] = useState(false)
    const [showMoveSkills, setShowMoveSkills] = useState(false)

    function openArchiveModal(): void {
        setShowArchive(true)
    }

    function openMoveSkillsModal(): void {
        setShowMoveSkills(true)
    }

    function closeArchiveModal(archived?: boolean): void {
        if (archived) {
            refetchSkills()
            context.toggleAll()
        }

        setShowArchive(false)
    }

    function closeMoveSkillsModal(moved?: boolean): void {
        if (moved) {
            refetchSkills()
            context.toggleAll()
        }

        setShowMoveSkills(false)
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
                variant='linkblue'
                label='Replace selected'
                size='lg'
                disabled={!hasSelection}
            />
            <Button
                primary
                variant='linkblue'
                label='Move selected'
                size='lg'
                disabled={!hasSelection}
                onClick={openMoveSkillsModal}
            />

            {showArchive && (
                <ArchiveSkillsModal skills={context.selectedSkills} onClose={closeArchiveModal} />
            )}

            {showMoveSkills && (
                <MoveSkillsModal skills={context.selectedSkills} onClose={closeMoveSkillsModal} />
            )}
        </div>
    )
}

export default BulkEditor
