import { filter as filterBy, orderBy } from 'lodash'
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'

import { allCertificationsGetAsync, LearnCertification } from './all-certifications-functions'
import { AllCertificationsProviderData } from './all-certifications-provider-data.model'

interface CertificationsAllProviderSortOptions {
    direction: 'asc'|'desc',
    field: keyof LearnCertification
}

interface CertificationsAllProviderFilterOptions {
    field: keyof LearnCertification,
    value: string
}

interface CertificationsAllProviderOptions {
    enabled?: boolean
    filter?: CertificationsAllProviderFilterOptions
    sort?: CertificationsAllProviderSortOptions
}

export function useAllCertifications(
    provider?: string,
    certificationId?: string,
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {
    const sort: MutableRefObject<CertificationsAllProviderSortOptions | undefined> = useRef(options?.sort)
    const filter: MutableRefObject<CertificationsAllProviderFilterOptions | undefined> = useRef(options?.filter)

    const [state, setState]:
        [AllCertificationsProviderData, Dispatch<SetStateAction<AllCertificationsProviderData>>]
        = useState<AllCertificationsProviderData>({
            allCertifications: [],
            certifications: [],
            loading: false,
            ready: false,
        })

    function getSortedCertifications(
        certificates: Array<LearnCertification>
    ): Array<LearnCertification> {
        return !sort.current
            ? certificates
            : orderBy(
                [...certificates],
                [sort.current.field, 'title'], // always second sort by title
                [sort.current.direction, 'asc']
            )
    }

    function getFilteredCertifications(
        certificates: Array<LearnCertification>
    ): Array<LearnCertification> {
        return !filter.current?.value
            ? certificates
            : filterBy([...certificates], {[filter.current.field]: filter.current.value})
    }

    function getFilteredAndSortedCertifications(
        certificates: Array<LearnCertification>
    ): Array<LearnCertification> {
        return getSortedCertifications(getFilteredCertifications(certificates))
    }

    if (sort.current?.direction !== options?.sort?.direction || sort.current?.field !== options?.sort?.field) {
        sort.current = options?.sort ? { ...options?.sort } : undefined

        // wait to exit current render loop before triggering a new state update
        setTimeout(() => setState((prevState) => ({
            ...prevState,
            certifications: getFilteredAndSortedCertifications(prevState.allCertifications),
        })))
    }

    if (filter.current?.field !== options?.filter?.field || filter.current?.value !== options?.filter?.value) {
        filter.current = options?.filter ? { ...options?.filter } : undefined

        // wait to exit current render loop before triggering a new state update
        setTimeout(() => setState((prevState) => ({
            ...prevState,
            certifications: getFilteredAndSortedCertifications(prevState.allCertifications),
        })))
    }

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
                const filteredCertifications: Array<LearnCertification> = getFilteredCertifications(certifications)
                const sortedCertifications: Array<LearnCertification> = getSortedCertifications(filteredCertifications)

                setState((prevState) => ({
                    ...prevState,
                    allCertifications: certificationId ? [] : [...certifications],
                    certification: !certificationId ? undefined : certifications as unknown as LearnCertification,
                    certifications: certificationId ? [] : sortedCertifications,
                    loading: false,
                    ready: true,
                }))
            })
    }, [provider, certificationId, options?.enabled])

    return state
}
