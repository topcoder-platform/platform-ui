import { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from 'react'
import _ from 'lodash'

import { updateOrCreateMemberTraitsAsync, UserTraitCategoryNames, UserTraitIds } from '~/libs/core'

import PersonalizationInfo from '../models/PersonalizationInfo'

export interface useAutoSavePersonalizationType {
    personalizationInfo: PersonalizationInfo | undefined
    loading: boolean
    setPersonalizationInfo: Dispatch<SetStateAction<PersonalizationInfo | undefined>>
}

type useAutoSavePersonalizationFunctionType = (
    reduxPersonalization: PersonalizationInfo | undefined,
    shouldSavingData: MutableRefObject<boolean>,
    profileHandle: string | undefined,
) => useAutoSavePersonalizationType

export const useAutoSavePersonalization: useAutoSavePersonalizationFunctionType = (
    reduxPersonalization: PersonalizationInfo | undefined,
    shouldSavingData: MutableRefObject<boolean>,
    profileHandle: string | undefined,
) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [personalizationInfo, setPersonalizationInfo] = useState<PersonalizationInfo | undefined>(undefined)

    const saveData: any = async () => {
        if (!personalizationInfo) return

        setLoading(true)
        try {
            await updateOrCreateMemberTraitsAsync(profileHandle || '', [{
                categoryName: UserTraitCategoryNames.personalization,
                traitId: UserTraitIds.personalization,
                traits: {
                    data: personalizationInfo,
                },
            }])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!!personalizationInfo && !_.isEqual(reduxPersonalization, personalizationInfo)) {
            if (loading) {
                shouldSavingData.current = true
                return
            }

            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [personalizationInfo])

    useEffect(() => {
        if (!personalizationInfo && !!reduxPersonalization) {
            setPersonalizationInfo(reduxPersonalization)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [reduxPersonalization])

    useEffect(() => {
        if (!loading && shouldSavingData.current) {
            shouldSavingData.current = false
            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    return {
        loading,
        personalizationInfo,
        setPersonalizationInfo,
    }
}
