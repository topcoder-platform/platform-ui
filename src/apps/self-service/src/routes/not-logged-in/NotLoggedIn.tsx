import {
    Dispatch,
    FC,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { ProfileContextData, profileContext } from '~/libs/core'
import { Button, ContentLayout, LoadingSpinner } from '~/libs/ui'

import { workDashboardRoute, selfServiceStartRoute } from '../../self-service.routes'

import WelcomeImage from './welcome.png'
import styles from './NotLoggedIn.module.scss'
import { clearAutoSavedForm, clearCachedChallengeId } from '../../utils/autoSaveBeforeLogin'

const NotLoggedIn: FC<{}> = () => {

    const [isLoading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true)
    const { initialized, isLoggedIn }: ProfileContextData = useContext(profileContext)
    const navigate: NavigateFunction = useNavigate()

    useEffect(() => {
        if (isLoggedIn) {
            navigate(workDashboardRoute)
        } else if (initialized) {
            setLoading(false)
        }
    }, [isLoggedIn, initialized, navigate])

    if (isLoading) {
        return <LoadingSpinner />
    }

    function startWork(): void {
        clearCachedChallengeId()
        clearAutoSavedForm()
        // dispatch(resetIntakeForm(true))
        navigate(selfServiceStartRoute)
    }

    return (
        <ContentLayout>
            <div className={styles.container}>

                <div className={styles.leftContent}>
                    <img
                        alt='welcome'
                        className={styles.welcomeImage}
                        src={WelcomeImage}
                    />
                </div>

                <div className={styles.rightContent}>

                    <h2 className={styles.title}>
                        put our great talent to work for you
                    </h2>

                    <p className={styles.description}>
                        Amazing talent. Passionate people.
                        <br />
                        Start something great today.
                    </p>

                    <Button
                        buttonStyle='secondary'
                        label='Create work'
                        onClick={startWork}
                    />
                </div>

            </div>
        </ContentLayout>
    )
}

export default NotLoggedIn;
