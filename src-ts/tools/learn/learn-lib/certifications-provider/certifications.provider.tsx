import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { getCertificationsAsync, LearnCertification } from './certifications-functions'
import { CertificationsProviderData } from './certifications-provider-data.model'

interface CertificationsProviderOptions {
    enabled?: boolean
}

export function useCertificationsProvider(
    provider?: string,
    certificationId?: string,
    options?: CertificationsProviderOptions
): CertificationsProviderData {
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

        if (options?.enabled === false) {
            return
        }

        getCertificationsAsync(provider, certificationId).then((certifications) => {
            setState((prevState) => ({
                ...prevState,
                ...(certificationId ? {certification: certifications as unknown as LearnCertification} : {
                    certifications: [...certifications],
                }),
                certificationsCount: certifications.length,
                loading: false,
                ready: true,
            }))
        })
    }, [provider, certificationId, options?.enabled])

    return state
}
