import { FC, useEffect } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { LoadingSpinner } from '../../../../../lib'
import { workCreateAsync, WorkIntakeFormRoutes, WorkType, workUpdateAsync } from '../../../work-lib'
import { selfServiceStartRoute } from '../../../work.routes'

/**
 * This component is the intermediate step for when a user logs in mid work creation.
 * If a user who is not logged in starts creating a work item and clicks on Complete and Pay,
 * we cache the form and work type and redirect to the login prompt (we cannot call the challenge api
 * and create a challenge with an unauthorized user). After the user logs in successfully, it redirects back
 * to this page where we create and update the challenge, then navigate to the Review page
 */
const SaveAfterLogin: FC = () => {

    const navigate: NavigateFunction = useNavigate()

    useEffect(() => {
        const createAndUpdateAsync: () => Promise<void> = async () => {
            try {
                if (localStorage && localStorage.getItem('challengeInProgress') && localStorage.getItem('challengeInProgressType')) {
                    const workType: WorkType = localStorage.getItem('challengeInProgressType') as WorkType
                    const formData: any = JSON.parse(String(localStorage.getItem('challengeInProgress')))
                    formData.currentStep = 'review'

                    const challenge: any = await workCreateAsync(workType)

                    await workUpdateAsync(workType, challenge, formData)

                    localStorage.removeItem('challengeInProgress')
                    localStorage.removeItem('challengeInProgressType')
                    const nextUrl: string = `${WorkIntakeFormRoutes[workType]['review']}/${challenge?.id}`
                    navigate(nextUrl)
                }
            } catch (err) {
                navigate(selfServiceStartRoute)
            }
        }

        createAndUpdateAsync()
    }, [])

    return (
        <LoadingSpinner />
    )
}

export default SaveAfterLogin