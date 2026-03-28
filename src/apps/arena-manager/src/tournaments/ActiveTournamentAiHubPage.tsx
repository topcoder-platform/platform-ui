import { FC, useEffect } from 'react'

import ActiveTournamentPage from './ActiveTournamentPage'
import '../lib/styles/index.scss'

const ActiveTournamentAiHubPage: FC = () => {
    useEffect(() => {
        document.body.classList.add('arena-manager-app')
        return () => {
            document.body.classList.remove('arena-manager-app')
        }
    }, [])

    return <ActiveTournamentPage />
}

export default ActiveTournamentAiHubPage
