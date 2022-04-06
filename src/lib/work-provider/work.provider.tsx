import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { workGetAsync, WorkList } from './'
import { default as workContext, defaultWorkContextData } from './work.context'
import { WorkContextData } from './work-context-data.model'

export const WorkProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [workContextData, setWorkContextData]: [WorkContextData, Dispatch<SetStateAction<WorkContextData>>]
        = useState<WorkContextData>(defaultWorkContextData)

    useEffect(() => {
        console.log("******** getting my work")
        if (workContextData.initialized) {
            return
        }

        // need pages
        const getAndSetWork: () => Promise<void> = async () => {
            const work: WorkList | undefined = await workGetAsync("jay_peg", 1, 100)
            const contextData: WorkContextData = {
                initialized: true,
                work,
            }
            setWorkContextData(contextData)
        }
        getAndSetWork()
    })

    return (
        <workContext.Provider value={workContextData}>
            {children}
        </workContext.Provider>
    )
}
