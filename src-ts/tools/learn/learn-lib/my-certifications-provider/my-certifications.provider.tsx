import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { LearnMyCertification } from './learn-my-certification.model'
import myCertificationsJSON from './my-certifications-functions/my-certifications.json'
import { MyCertificationsProviderData } from './my-certifications-provider-data.model'

const myCertifications: Array<LearnMyCertification> = [...myCertificationsJSON.certifications] as Array<LearnMyCertification>

export const useMyCertifications: () => MyCertificationsProviderData = (): MyCertificationsProviderData => {
    const [state, setState]: [MyCertificationsProviderData, Dispatch<SetStateAction<MyCertificationsProviderData>>] = useState<MyCertificationsProviderData>({
        certifications: [],
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

        const t: ReturnType<typeof setTimeout> = setTimeout(() => {
            setState((prevState) => ({
                ...prevState,
                certifications: [...myCertifications],
                completed: myCertifications.filter(c => c.progress.status === 'completed'),
                inProgress: myCertifications.filter(c => c.progress.status === 'in-progress'),
                loading: false,
                ready: true,
            }))
        }, 350)

        return () => clearTimeout(t)
    }, [])

    return state
}
