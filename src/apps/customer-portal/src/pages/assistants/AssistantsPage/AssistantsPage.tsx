import { FC } from 'react'

import { AssistantCard } from '../AssistantCard'
import { assistantsConfig } from '../config/assistants-config'
import { assistantsRootRoute } from '../assistants.routes'

import styles from './AssistantsPage.module.scss'

const AssistantsPage: FC = () => (
    <main className={styles.page}>
        <h1>Assistants</h1>
        <p>Get assistance from Topcoder AI.</p>

        <div className={styles.cards}>
            {assistantsConfig.map(assistant => (
                <AssistantCard
                    key={assistant.id}
                    description={assistant.description}
                    icon={assistant.icon}
                    title={assistant.title}
                    to={`${assistantsRootRoute}/${assistant.id}`}
                />
            ))}
        </div>
    </main>
)

export default AssistantsPage
