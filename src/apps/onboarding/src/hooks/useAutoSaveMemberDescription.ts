import { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from 'react'
import _ from 'lodash'

import MemberInfo from '../models/MemberInfo'

export interface useAutoSaveMemberDescriptionType {
    description: string | undefined
    loading: boolean
    setDescription: Dispatch<SetStateAction<string | undefined>>
}

type useAutoSaveMemberDescriptionFunctionType = (
    memberInfo: MemberInfo | undefined,
    updateMemberDescription: (description: string) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => useAutoSaveMemberDescriptionType

export const useAutoSaveMemberDescription: useAutoSaveMemberDescriptionFunctionType = (
    memberInfo: MemberInfo | undefined,
    updateMemberDescription: (description: string) => void,
    shouldSavingData: MutableRefObject<boolean>,
) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [description, setDescription] = useState<string | undefined>(undefined)

    const saveData: any = async () => {
        if (description === undefined) {
            return
        }

        setLoading(true)
        await updateMemberDescription(description)

        setLoading(false)
    }

    useEffect(() => {
        if (description !== undefined && !_.isEqual(memberInfo?.description, description)) {
            if (loading) {
                shouldSavingData.current = true
                return
            }

            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [description])

    useEffect(() => {
        if (description === undefined && memberInfo && memberInfo.description !== undefined) {
            setDescription(memberInfo.description)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [memberInfo])

    useEffect(() => {
        if (!loading && shouldSavingData.current) {
            shouldSavingData.current = false
            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    return {
        description,
        loading,
        setDescription,
    }
}
