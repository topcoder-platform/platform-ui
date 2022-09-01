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

        allCertificationsGetAsync(provider, certificationId)
            .then((certifications) => {
                const certs: {
                    certification: LearnCertification;
                    certifications?: undefined;
                } | {
                    certification?: undefined;
                    certifications: Array<LearnCertification>;
                } = certificationId
                    ? {
                        certification: certifications as unknown as LearnCertification,
                    }
                    : {
                        certifications: [...certifications],
                    }
                setState((prevState) => ({
                    ...prevState,
                    ...certs,
                    certificationsCount: certifications.length,
                    loading: false,
                    ready: true,
                }))
            })
    }, [provider, certificationId, options?.enabled])

    return state
}
