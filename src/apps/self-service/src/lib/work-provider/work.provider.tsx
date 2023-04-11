import { Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from 'react'

import { logError, profileContext, ProfileContextData, UserProfile } from '~/libs/core'

import { messageGetUnreadCountAsync } from './message-functions'
import { WorkContextData } from './work-context-data.model'
import { Work, workGetAllAsync } from './work-functions'
import { default as workContext, defaultWorkContextData } from './work.context'

export const WorkProvider: FC<{ children: ReactNode }> = props => {

    const initialized = useRef(false);

    const [workContextData, setWorkContextData]: [WorkContextData, Dispatch<SetStateAction<WorkContextData>>]
        = useState<WorkContextData>(defaultWorkContextData)

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile }: ProfileContextData = profileContextData

    useEffect(() => {

        if (!!workContextData.initialized || !profile) {
            return
        }


        function remove(workId: string, work: Array<Work>): void {
            const workList: Array<Work> = [...work]
            const removedItemIndex: number = workList.findIndex(item => item.id === workId)
            // if we didn't find the removed index, just return
            if (!removedItemIndex) {
                return
            }

            workList.splice(removedItemIndex, 1)
            setWorkContextData({
                ...workContextData,
                hasWork: !!workList.length,
                initialized: true,
                work: workList,
            })
        }

        async function getAndSetWork(): Promise<void> {

            try {
                const safeProfile: UserProfile = profile as UserProfile

                let pageNumber: number = 1
                let nextSet: Array<Work> = await workGetAllAsync(safeProfile, pageNumber += 1)

                const contextData: WorkContextData = {
                    ...defaultWorkContextData,
                    hasWork: !!nextSet.length,
                    initialized: true,
                    remove,
                    work: nextSet,
                }

                // if we don't have any work, set the context and return
                if (!nextSet.length) {
                    contextData.messagesInitialized = true
                    setWorkContextData(contextData)
                    return
                }

                // get the rest of the pages, and update the list
                // after each response
                let output: Array<Work> = []
                let messageContextData: WorkContextData = { ...contextData }
                while (nextSet.length > 0) {
                    output = output.concat(nextSet)
                    messageContextData = {
                        ...messageContextData,
                        work: output,
                    }
                    setWorkContextData(messageContextData)
                    nextSet = await workGetAllAsync(safeProfile, pageNumber += 1)
                }

                // now that the work list is initialized,
                // set all the message counts individually in the background.
                const promises: Array<Promise<Work>> = output
                    .map(item => messageGetUnreadCountAsync(item.id, safeProfile.handle)
                        .then(messageCount => {
                            item.messageCount = messageCount
                            return item
                        })
                        .catch(() => item))

                Promise.all(promises)
                    .then(results => {
                        setWorkContextData({
                            ...contextData,
                            messagesInitialized: true,
                            work: results,
                        })
                    })

            } catch (error: any) {
                logError(error)
                const contextData: WorkContextData = {
                    ...defaultWorkContextData,
                    error: error.response?.data?.result?.content || error.message || error,
                    initialized: true,
                    messagesInitialized: true,
                    remove,
                }
                setWorkContextData(contextData)
            }
        }

        if (!initialized.current) {
            initialized.current = true;
            getAndSetWork()
        }
    }, [
        profile,
        workContextData,
    ])

    return (
        <workContext.Provider value={workContextData}>
            {props.children}
        </workContext.Provider>
    )
}
