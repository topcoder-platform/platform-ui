import { orderBy } from 'lodash'
import { Dispatch, SetStateAction, useEffect, useState, useRef } from 'react'

import { allCertificationsGetAsync, LearnCertification } from './all-certifications-functions'
import { AllCertificationsProviderData } from './all-certifications-provider-data.model'
import { ALL_CERTIFICATIONS_DEFAULT_SORT, ALL_CERTIFICATIONS_SORT_FIELD_TYPE } from './all-certifications-sort-options'

type SORT_DIRECTION = 'asc'|'desc'
const DEFAULT_SORT_DIRECTION: SORT_DIRECTION = 'desc'


interface CertificationsAllProviderOptions {
    enabled?: boolean
    sort?: {
        direction: SORT_DIRECTION,
        field: ALL_CERTIFICATIONS_SORT_FIELD_TYPE
    },
    filter?: undefined|'data-science'|'web-development'|'backend-development'
}

export function useAllCertifications(
    provider?: string,
    certificationId?: string,
    options?: CertificationsAllProviderOptions
): AllCertificationsProviderData {
    const sort = useRef({
        field: ALL_CERTIFICATIONS_DEFAULT_SORT,
        direction: DEFAULT_SORT_DIRECTION,
        ...options?.sort,
    });
    // const filter = useRef(options?.filter);

    const [state, setState]:
        [AllCertificationsProviderData, Dispatch<SetStateAction<AllCertificationsProviderData>>]
        = useState<AllCertificationsProviderData>({
            allCertifications: [],
            certifications: [],
            loading: false,
            ready: false,
        })

    function sortCertifications(certificates: Array<LearnCertification>, sortField: ALL_CERTIFICATIONS_SORT_FIELD_TYPE, sortDir: SORT_DIRECTION) {
        return orderBy([...certificates], sortField, sortDir)
    }

    function sortCertificates() {
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
            field: options?.sort?.field ?? ALL_CERTIFICATIONS_DEFAULT_SORT,
            direction: options?.sort?.direction ?? DEFAULT_SORT_DIRECTION,
        };

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
                const sortedCertifications = sortCertifications(
                    certifications,
                    sort.current.field,
                    sort.current.direction,
                )

                setState((prevState) => ({
                    ...prevState,
                    certifications: certificationId ? [] : sortedCertifications,
                    certification: !certificationId ? undefined : certifications as unknown as LearnCertification,
                    allCertifications: certificationId ? [] : [...certifications],
                    loading: false,
                    ready: true,
                }))
            })
    }, [provider, certificationId, options?.enabled])

    return state
}
