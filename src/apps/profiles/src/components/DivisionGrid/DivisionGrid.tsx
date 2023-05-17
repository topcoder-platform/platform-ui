import { FC } from 'react'
import classNames from 'classnames'
import { SRMDivisionStats } from '~/libs/core'

import styles from './DivisionGrid.module.scss'

interface DivisionGridProps {
    divisionData: Array<SRMDivisionStats>
    number: number
}

const DivisionGrid: FC<DivisionGridProps> = (props: DivisionGridProps) => {
    const { divisionData, number } = props
    const l1 = divisionData.find((d) => d.levelName === 'Level One')
    const l2 = divisionData.find((d) => d.levelName === 'Level Two')
    const l3 = divisionData.find((d) => d.levelName === 'Level Three')
    const totalCreated = (l1?.problemsSubmitted || 0) + (l2?.problemsSubmitted || 0) + (l3?.problemsSubmitted || 0)
    const totalFailed = (l1?.problemsFailed || 0) + (l2?.problemsFailed || 0) + (l3?.problemsFailed || 0)
    const totalSysTest = (l1?.problemsSysByTest || 0) + (l2?.problemsSysByTest || 0) + (l3?.problemsSysByTest || 0)
    const totalSuccess = Math.ceil(((1 - ((totalFailed + totalSysTest) / totalCreated)) * 100) || 0)
    const l1Success = Math.ceil(((1 - (((l1?.problemsFailed || 0) + (l1?.problemsSysByTest || 0)) / (l1?.problemsSubmitted || 0))) * 100) || 0)
    const l2Success = Math.ceil(((1 - (((l2?.problemsFailed || 0) + (l2?.problemsSysByTest || 0)) / (l2?.problemsSubmitted || 0))) * 100) || 0)
    const l3Success = Math.ceil(((1 - (((l3?.problemsFailed || 0) + (l3?.problemsSysByTest || 0)) / (l3?.problemsSubmitted || 0))) * 100) || 0)

    return (
        <div className={styles.divisionGrid}>
            <p className="body-medium-bold">Division {number}</p>
            <p className={styles.gridHead}>SUCCESS</p>
            <p className={styles.gridHead}>CREATED</p>
            <p className={styles.gridHead}>FAILED CHALLENGES</p>
            <p className={styles.gridHead}>FAILED SYS TEST</p>
            <p className={classNames(styles.gridLeftSidebar, styles.blue)}>TOTAL</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalSuccess}%</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalCreated}</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalFailed}</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalSysTest}</p>
            <p className={styles.gridLeftSidebar}>Level One</p>
            <p className={styles.gridCell}>{l1Success}%</p>
            <p className={styles.gridCell}>{l1?.problemsSubmitted}</p>
            <p className={styles.gridCell}>{l1?.problemsFailed}</p>
            <p className={styles.gridCell}>{l1?.problemsSysByTest}</p>
            <p className={styles.gridLeftSidebar}>Level Two</p>
            <p className={styles.gridCell}>{l2Success}%</p>
            <p className={styles.gridCell}>{l2?.problemsSubmitted}</p>
            <p className={styles.gridCell}>{l2?.problemsFailed}</p>
            <p className={styles.gridCell}>{l2?.problemsSysByTest}</p>
            <p className={styles.gridLeftSidebar}>Level Three</p>
            <p className={styles.gridCell}>{l3Success}%</p>
            <p className={styles.gridCell}>{l3?.problemsSubmitted}</p>
            <p className={styles.gridCell}>{l3?.problemsFailed}</p>
            <p className={styles.gridCell}>{l3?.problemsSysByTest}</p>
        </div>
    )
}

export default DivisionGrid
