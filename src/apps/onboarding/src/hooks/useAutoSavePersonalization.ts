import { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from 'react'
import _ from 'lodash'

import PersonalizationInfo from '../models/PersonalizationInfo'

export interface useAutoSavePersonalizationType {
    personalizationInfo: PersonalizationInfo | undefined
    loading: boolean
    setPersonalizationInfo: Dispatch<SetStateAction<PersonalizationInfo | undefined>>
}

type useAutoSavePersonalizationFunctionType = (
    reduxPersonalization: PersonalizationInfo | undefined,
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => useAutoSavePersonalizationType

export const useAutoSavePersonalization: useAutoSavePersonalizationFunctionType = (
    reduxPersonalization: PersonalizationInfo | undefined,
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [personalizationInfo, setPersonalizationInfo] = useState<PersonalizationInfo | undefined>(undefined)

    const saveData: any = async () => {
        if (!personalizationInfo) {
            return
        }

        setLoading(true)
        if (!reduxPersonalization) {
            await createMemberPersonalizations([personalizationInfo])
        } else {
            await updateMemberPersonalizations([personalizationInfo])
        }

        setLoading(false)
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
        if (!personalizationInfo && reduxPersonalization) {
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
