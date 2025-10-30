import { FC } from 'react'

import { AiScorecardContextModel } from '~/apps/review/src/lib/models'

import { useAiScorecardContext } from '../../AiScorecardContext'

import styles from './ScorecardHeader.module.scss'

const ScorecardHeader: FC = () => {
    const { workflow }: AiScorecardContextModel = useAiScorecardContext()

    return (
        <div className={styles.wrap}>
            {workflow?.name}
        </div>
    )
}

export default ScorecardHeader
