import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { allCertificationsGetAsync, LearnCertification } from './all-certifications-functions'
import { AllCertificationsProviderData } from './all-certifications-provider-data.model'

interface CertificationsAllProviderOptions {
    enabled?: boolean
}

export function useAllCertifications(
    provider?: string,
    certificationId?: string,
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {
    const [state, setState]:
        [AllCertificationsProviderData, Dispatch<SetStateAction<AllCertificationsProviderData>>]
        = useState<AllCertificationsProviderData>({
            certifications: [],
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

        allCertificationsGetAsync(provider, certificationId)
            .then((certifications) => {
                setState((prevState) => ({
                    ...prevState,
                    certification: !certificationId ? undefined : certifications as unknown as LearnCertification,
                    certifications: certificationId ? [] : [...certifications],
                    loading: false,
                    ready: true,
                }))
            })
    }, [provider, certificationId, options?.enabled])

    return state
}
