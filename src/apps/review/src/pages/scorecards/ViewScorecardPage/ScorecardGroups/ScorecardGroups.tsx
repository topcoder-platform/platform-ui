import { FC } from 'react'

import { ScorecardGroup } from '~/apps/review/src/lib/models'

import ScorecardSections from '../ScorecardSections/ScorecardSections'

import styles from './ScorecardGroups.module.scss'

interface ScorecardGroupsProps {
    groups: ScorecardGroup[]
}

const ScorecardGroups: FC<ScorecardGroupsProps> = (props: ScorecardGroupsProps) => (
    <div className={styles.container}>
        {
            props.groups.map((group, index) => (
                <div key={group.id} className={styles.group}>
                    <div className={styles.heading}>
                        <div className={styles.groupNumber}>{`Group ${index + 1}`}</div>
                        <div className={styles.groupInfo}>
                            <div className={styles.name}>{group.name}</div>
                            <div className={styles.weight}>{group.weight}</div>
                        </div>
                    </div>
                    <ScorecardSections sections={group.sections} />
                </div>
            ))
        }
    </div>
)

export default ScorecardGroups
