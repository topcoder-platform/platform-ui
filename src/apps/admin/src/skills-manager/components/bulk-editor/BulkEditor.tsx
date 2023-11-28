import { FC, useState } from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'

import { ArchiveSkillsModal } from './archive-skills-modal'
import styles from './BulkEditor.module.scss'

interface BulkEditorProps {
    className?: string
}

const BulkEditor: FC<BulkEditorProps> = props => {
    const { bulkEditorCtx: context }: SkillsManagerContextValue = useSkillsManagerContext()
    const [showArchive, setShowArchive] = useState(false)

    function toggleArchive(): void {
        setShowArchive(d => !d)
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
                onClick={toggleArchive}
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
            />

            {showArchive && (
                <ArchiveSkillsModal skills={context.selectedSkills} onClose={toggleArchive} />
            )}
        </div>
    )
}

export default BulkEditor
