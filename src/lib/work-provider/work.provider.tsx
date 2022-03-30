import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { getWork, WorkList } from './'
import { defaultWorkContextData, WorkContext } from './work.context'
import { WorkContextData } from './work-context-data.model'

export const WorkProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [workContext, setWorkContext]: [WorkContextData, Dispatch<SetStateAction<WorkContextData>>]
        = useState<WorkContextData>(defaultWorkContextData)

    useEffect(() => {
        if (workContext.initialized) {
            return
        }

        // need pages
        const getAndSetWork: () => Promise<void> = async () => {
            const work: workList | undefined = await getWork()
            const contextData: WorkContextData = {
                initialized: true,
                work,
            }
            setWorkContext(contextData)
        }
        getAndSetWork()
    })

    return (
        <WorkContext.Provider value={workContext}>
            {children}
        </WorkContext.Provider>
    )
}
