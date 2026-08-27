import { ComponentType, FC, SVGProps } from 'react'
import { Link } from 'react-router-dom'

import styles from './AssistantCard.module.scss'

interface AssistantCardProps {
    title: string
    description: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    to: string
}

const AssistantCard: FC<AssistantCardProps> = props => {
    const Icon = props.icon

    return (
        <Link className={styles.wrap} to={props.to}>
            <div className={styles.content}>
                <h3 className={styles.title}>{props.title}</h3>
                <p className={styles.description}>{props.description}</p>
            </div>

            <div className={styles.agentRail}>
                <span className={styles.iconBadge}>
                    <Icon aria-hidden='true' className={styles.icon} />
                </span>
            </div>
        </Link>
    )
}

export default AssistantCard
