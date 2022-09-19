import { orderBy } from 'lodash'
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'

import { allCertificationsGetAsync, LearnCertification } from './all-certifications-functions'
import { AllCertificationsProviderData } from './all-certifications-provider-data.model'
import { ALL_CERTIFICATIONS_DEFAULT_SORT, ALL_CERTIFICATIONS_SORT_FIELD_TYPE } from './all-certifications-sort-options'

type SORT_DIRECTION = 'asc'|'desc'
const DEFAULT_SORT_DIRECTION: SORT_DIRECTION = 'desc'

interface CertificationsAllProviderSortOptions {
    direction: SORT_DIRECTION,
    field: ALL_CERTIFICATIONS_SORT_FIELD_TYPE
}

interface CertificationsAllProviderOptions {
    enabled?: boolean
    filter?: undefined|'data-science'|'web-development'|'backend-development'
    sort?: CertificationsAllProviderSortOptions
}

export function useAllCertifications(
    provider?: string,
    certificationId?: string,
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {
    const sort: MutableRefObject<CertificationsAllProviderSortOptions> = useRef({
        direction: DEFAULT_SORT_DIRECTION,
        field: ALL_CERTIFICATIONS_DEFAULT_SORT,
        ...options?.sort,
    })
    // const filter = useRef(options?.filter);

    const [state, setState]:
        [AllCertificationsProviderData, Dispatch<SetStateAction<AllCertificationsProviderData>>]
        = useState<AllCertificationsProviderData>({
            allCertifications: [],
            certifications: [],
            loading: false,
            ready: false,
        })

    function sortCertifications(
        certificates: Array<LearnCertification>,
        sortField: ALL_CERTIFICATIONS_SORT_FIELD_TYPE,
        sortDir: SORT_DIRECTION
    ): Array<LearnCertification> {
        return orderBy([...certificates], sortField, sortDir)
    }

    function sortCertificates(): void {
        setState((prevState) => ({
            ...prevState,
            certifications: sortCertifications(
                prevState.allCertifications,
                sort.current.field,
                sort.current.direction,
            ),
        }))
    }

    if (options?.sort && (sort.current?.direction !== options?.sort?.direction || sort.current?.field !== options?.sort?.field)) {
        sort.current = {
            direction: options?.sort?.direction ?? DEFAULT_SORT_DIRECTION,
            field: options?.sort?.field ?? ALL_CERTIFICATIONS_DEFAULT_SORT,
        }

        // wait to exit current render loop before triggering a new state update
        setTimeout(sortCertificates)
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
                const sortedCertifications: Array<LearnCertification> = sortCertifications(
                    certifications,
                    sort.current.field,
                    sort.current.direction,
                )

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
