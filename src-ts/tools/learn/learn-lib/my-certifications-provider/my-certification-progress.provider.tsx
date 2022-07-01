import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { LearnMyCertification } from './learn-my-certification.model'
import { MyCertificationProgressProviderData } from './my-certification-progress-provider-data.model'
import myCertificationsJSON from './my-certifications-functions/my-certifications.json'

const myCertifications: Array<LearnMyCertification> = [...myCertificationsJSON.certifications] as Array<LearnMyCertification>

export const useMyCertificationProgress: (certification?: string) => MyCertificationProgressProviderData = (certification?: string): MyCertificationProgressProviderData => {
    const [state, setState]: [MyCertificationProgressProviderData, Dispatch<SetStateAction<MyCertificationProgressProviderData>>] = useState<MyCertificationProgressProviderData>({
        loading: false,
        progress: undefined,
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
                loading: false,
                progress: myCertifications.find(c => c.certification === certification)?.progress,
                ready: true,
            }))
        }, 350)

        return () => clearTimeout(t)
    }, [])

    return state
}
