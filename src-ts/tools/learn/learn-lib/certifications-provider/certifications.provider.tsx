import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { getCertificationsAsync } from './certifications-functions'
import { CertificationsProviderData } from './certifications-provider-data.model'

export const useCertificationsProvider: () => CertificationsProviderData = (): CertificationsProviderData => {
    const [state, setState]: [CertificationsProviderData, Dispatch<SetStateAction<CertificationsProviderData>>] = useState<CertificationsProviderData>({
        certifications: [],
        certificationsCount: 0,
        loading: false,
        ready: false,
    })

    useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        getCertificationsAsync().then((certifications) => {
            setState((prevState) => ({
                ...prevState,
                certifications: [...certifications],
                certificationsCount: certifications.length,
                loading: false,
                ready: true,
            }))
        })
    }, [])

    return state
}
