import {
    Dispatch,
    FC,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react'
import { useDispatch } from 'react-redux'
import { NavigateFunction, useNavigate } from 'react-router-dom'

// TODO: move this from the legacy to the nextgen app
import { resetIntakeForm } from '../../../../src/actions/form'
import { clearAutoSavedForm, clearCachedChallengeId } from '../../../../src/autoSaveBeforeLogin'
import {
    Button,
    ContentLayout,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import { dashboardRoute, selfServiceStartRoute } from '../work.routes'

import WelcomeImage from './welcome.png'
import styles from './WorkNotLoggedIn.module.scss'

const WorkNotLoggedIn: FC<{}> = () => {

    const [isLoading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true)
    const { initialized, isLoggedIn }: ProfileContextData = useContext(profileContext)
    const dispatch: Dispatch<any> = useDispatch()
    const navigate: NavigateFunction = useNavigate()

    useEffect(() => {
        if (isLoggedIn) {
            navigate(dashboardRoute)
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
        dispatch(resetIntakeForm(true))
        navigate(selfServiceStartRoute)
    }

    return (
        <ContentLayout title=''>
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

export default WorkNotLoggedIn
