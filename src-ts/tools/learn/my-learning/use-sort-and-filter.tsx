import { groupBy, mapValues, orderBy } from 'lodash'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { LearnCertification, UserCertificationCompleted, UserCertificationInProgress } from '../learn-lib'

type MyCertificationsType = ReadonlyArray<UserCertificationInProgress&UserCertificationCompleted>

export interface UseSortAndFilterValue {
    certifications: MyCertificationsType,
    handleCategoryChange: (category: string) => void,
    handleSortChange: (field: string) => void,
}

export const useSortAndFilter: (
    certifications: ReadonlyArray<LearnCertification>,
    myCertifications: ReadonlyArray<UserCertificationInProgress|UserCertificationCompleted>
) => UseSortAndFilterValue = (
    certifications,
    myCertifications
) => {

    const [selectedCategory, setSelectedCategory]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>('')

    const [sortingField, setSortingField]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>('')

    const [sortingDirection, setSortingDirection]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>('asc')

    const handleSortChange: (field: string) => void = (field: string) => {

        setSortingField(field.replace(/^-/, ''))
        setSortingDirection(field.startsWith('-') ? 'desc' : 'asc')
    }

    const myCertificatesByCategory: {[key: string]: MyCertificationsType} = useMemo(() => {

        const certsById: {[key: string]: LearnCertification} = mapValues(groupBy(certifications, 'id'), ([cert]) => cert)
        return groupBy(
            myCertifications as MyCertificationsType,
            (cert) => certsById[cert.certificationId]?.category
        )
    }, [certifications, myCertifications])

    const myCertificationsFiltered: MyCertificationsType = (
        !selectedCategory ? myCertifications : myCertificatesByCategory[selectedCategory]
    ) as MyCertificationsType ?? []

    const myCertificationsSorted: MyCertificationsType = orderBy(
        myCertificationsFiltered,
        sortingField,
        sortingDirection as 'asc'|'desc'
    )

    return {
        certifications: myCertificationsSorted,
        handleCategoryChange: setSelectedCategory,
        handleSortChange,

    }
}
