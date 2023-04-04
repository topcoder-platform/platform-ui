import { FC } from 'react'

import { Button } from '../../../../../lib'
import { WorkSolution } from '../../../work-lib'

import styles from './WorkSolutionsListItem.module.scss'

interface WorkSolutionsListItemProps {
    onDownload: (solutionId: string) => void
    solution: WorkSolution
}

const WorkSolutionsListItem: FC<WorkSolutionsListItemProps> = (props: WorkSolutionsListItemProps) => {
    function handleClick(): void {
        props.onDownload(props.solution.id)
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.name}>
                <span>Submitted by:</span>
                <span>{props.solution.createdBy}</span>
            </div>

            <Button
                buttonStyle='secondary'
                tabIndex={-1}
                label='Download'
                size='md'
                onClick={handleClick}
            />
        </div>
    )
}

export default WorkSolutionsListItem
