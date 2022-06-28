import { FC } from 'react'

import { Button } from '../../../../../lib'
import { WorkSolution } from '../../../work-lib'

import styles from './WorkSolutionsListItem.module.scss'

interface WorkSolutionsListItemProps {
    onDownload: (solutionId: string) => void
    solution: WorkSolution
}

const WorkSolutionsListItem: FC<WorkSolutionsListItemProps> = (props: WorkSolutionsListItemProps) => {
    return (
        <div className={styles['wrap']}>
            <div className={styles.name}>
                <span>Submitted by:</span>
                <span>{props.solution.createdBy}</span>
            </div>

            <Button
                buttonStyle='secondary'
                tabIndex={-1}
                label='Download'
                size='md'
                onClick={() => props.onDownload(props.solution.id)}
            />
        </div>
    )
}

export default WorkSolutionsListItem
