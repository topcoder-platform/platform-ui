import { Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react'

import { logError, profileContext, ProfileContextData, UserProfile } from '../../../../lib'

import { WorkContextData } from './work-context-data.model'
import { Work, workGetAllAsync, } from './work-functions'
import { default as workContext, defaultWorkContextData } from './work.context'

export const WorkProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [workContextData, setWorkContextData]: [WorkContextData, Dispatch<SetStateAction<WorkContextData>>]
        = useState<WorkContextData>(defaultWorkContextData)

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile }: ProfileContextData = profileContextData

    useEffect(() => {

        if (!!workContextData.initialized || !profile) {
            return
        }

        async function getAndSetWork(): Promise<void> {

            try {
                const work: Array<Work> = await workGetAllAsync(profile as UserProfile)
                const contextData: WorkContextData = {
                    hasWork: !!work.length,
                    initialized: true,
                    refresh: getAndSetWork,
                    work,
                }
                setWorkContextData(contextData)

            } catch (error: any) {
                logError(error)
                const contextData: WorkContextData = {
                    ...defaultWorkContextData,
                    error: error.response?.data?.result?.content || error.message || error,
                    initialized: true,
                    refresh: getAndSetWork,
                }
                setWorkContextData(contextData)
            }
        }

        getAndSetWork()
    }, [
        profile,
        workContextData.initialized,
    ])

    return (
        <workContext.Provider value={workContextData}>
            {children}
        </workContext.Provider>
    )
}
