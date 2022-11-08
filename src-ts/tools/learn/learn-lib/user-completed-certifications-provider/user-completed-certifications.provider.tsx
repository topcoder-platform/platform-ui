import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { LearnUserCompletedCertification, userCompletedCertificationGetAsync } from './user-completed-certifications-functions'
import { UserCompletedCertificationsProviderData } from './user-completed-certifications-provider-data.model'

export function useUserCompletedCertifications(userId?: number, provider?: string, certification?: string):
    UserCompletedCertificationsProviderData {

    const [state, setState]:
        [UserCompletedCertificationsProviderData, Dispatch<SetStateAction<UserCompletedCertificationsProviderData>>]
        = useState<UserCompletedCertificationsProviderData>({
            certifications: [],
            loading: false,
            ready: false,
        })

    useEffect(() => {
        let mounted: boolean = true

        setState(prevState => ({
            ...prevState,
            loading: true,
        }))

        if (!userId) {
            return
        }

        userCompletedCertificationGetAsync(userId)
            .then(completedCertifications => {

                if (!mounted) {
                    return
                }

                let certifications: Array<LearnUserCompletedCertification> = completedCertifications

                if (provider || certification) {
                    certifications = completedCertifications.filter(c => (!provider || c.provider === provider)
                        && (!certification || c.certification === certification))
                }

                setState(prevState => ({
                    ...prevState,
                    certifications,
                    loading: false,
                    ready: true,
                }))
            })

        return () => {
            mounted = false
        }
    }, [
        certification,
        provider,
        userId,
    ])

    return state
}
