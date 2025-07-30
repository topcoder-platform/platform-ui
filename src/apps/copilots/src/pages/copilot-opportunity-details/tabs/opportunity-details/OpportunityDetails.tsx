import { FC } from 'react'

import { CopilotOpportunity } from '../../../../models/CopilotOpportunity'

import styles from './styles.module.scss'

const OpportunityDetails: FC<{
    opportunity?: CopilotOpportunity
}> = props => (
    <div className={styles.content}>
        <div>
            <h2 className={styles.subHeading}> Required skills </h2>
            <div className={styles.skillsContainer}>
                {props.opportunity?.skills.map(item => (<span className={styles.skillPill}>{item.name}</span>))}
            </div>
            <h2 className={styles.subHeading}> Description </h2>
            <p>
                {props.opportunity?.overview}
            </p>
        </div>
        <div>
            <h2 className={styles.subHeading}> Complexity </h2>
            <span className={styles.textCaps}>{props.opportunity?.complexity}</span>

            <h2 className={styles.subHeading}> Requires Communication </h2>
            <span className={styles.textCaps}>{props.opportunity?.requiresCommunication}</span>
        </div>
    </div>
)

export default OpportunityDetails
