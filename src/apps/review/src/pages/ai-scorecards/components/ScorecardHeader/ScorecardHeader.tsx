import { FC } from 'react'

import styles from './ScorecardHeader.module.scss'
import { useAiScorecardContext } from '../../AiScorecardContext'
import { AiScorecardContextModel } from '~/apps/review/src/lib/models'

interface ScorecardHeaderProps {
}

const ScorecardHeader: FC<ScorecardHeaderProps> = props => {
    const { workflow, scorecard }: AiScorecardContextModel = useAiScorecardContext()

    return (
        <div className={styles.wrap}>
            {workflow?.name}
        </div>
    )
}

export default ScorecardHeader
