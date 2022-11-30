import { FC } from 'react'

import '../../../../lib/styles/index.scss'

import styles from './WorkNoResults.module.scss'

interface WorkNoResultsProps {
    filtered: boolean
}

const WorkNoResults: FC<WorkNoResultsProps> = (props: WorkNoResultsProps) => {

    const message: string = props.filtered ? 'No items available' : 'Your future work will live here. Let\'s go!'

    return (
        <div className={styles['start-message']}>
            <div className='body-large'>
                {message}
            </div>
        </div>
    )
}

export default WorkNoResults
