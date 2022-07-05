import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { getMyCertificationsProgressAsync, MyCertificationProgressStatus } from './my-certifications-functions'
import { mapCompletedPercentage } from './my-certifications-functions/certificate-progress.decorators'
import { MyCertificationsProviderData } from './my-certifications-provider-data.model'

export function useMyCertifications(userId?: number): MyCertificationsProviderData {
    const [state, setState]: [MyCertificationsProviderData, Dispatch<SetStateAction<MyCertificationsProviderData>>] = useState<MyCertificationsProviderData>({
        completed: [],
        inProgress: [],
        loading: false,
        ready: false,
    })

    useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        if (!userId) {
            return
        }

        getMyCertificationsProgressAsync(userId).then(mapCompletedPercentage).then((myCertifications) => {
            setState((prevState) => ({
                ...prevState,
                completed: myCertifications.filter(c => c.status === MyCertificationProgressStatus.completed),
                inProgress: myCertifications.filter(c => c.status === MyCertificationProgressStatus.inProgress),
                loading: false,
                ready: true,
            }))
        })
    }, [userId])

    return state
}
