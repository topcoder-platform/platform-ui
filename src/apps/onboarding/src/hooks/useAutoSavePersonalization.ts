import { Dispatch, MutableRefObject, SetStateAction, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'

import PersonalizationInfo from '../models/PersonalizationInfo'

export interface useAutoSavePersonalizationType {
    personalizationInfo: PersonalizationInfo | undefined
    loading: boolean
    setPersonalizationInfo: Dispatch<SetStateAction<PersonalizationInfo | undefined>>
}

type useAutoSavePersonalizationFunctionType = (
    reduxPersonalizations: PersonalizationInfo[] | undefined,
    savingFields: string[],
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => useAutoSavePersonalizationType

export const useAutoSavePersonalization: useAutoSavePersonalizationFunctionType = (
    reduxPersonalizations: PersonalizationInfo[] | undefined,
    savingFields: string[],
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [personalizationInfo, setPersonalizationInfo] = useState<PersonalizationInfo | undefined>(undefined)
    const reduxPersonalization = useMemo(() => (reduxPersonalizations || []).find(
        (trait: any) => _.some(savingFields, (savingField: string) => trait[savingField] !== undefined),
    ), [reduxPersonalizations, savingFields])

    const saveData: any = async () => {
        if (!personalizationInfo) {
            return
        }

        const datas: PersonalizationInfo[] = [
            ..._.reject(
                reduxPersonalizations || [],
                (trait: any) => _.some(savingFields, (savingField: string) => trait[savingField] !== undefined),
            ),
            personalizationInfo,
        ]

        setLoading(true)
        if (!reduxPersonalization) {
            await createMemberPersonalizations(datas)
        } else {
            await updateMemberPersonalizations(datas)
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
