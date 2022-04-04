import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { getWork, workList } from './'
import { defaultWorkContextData, workContext } from './work.context'
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
            const work: workList | undefined = await getWork("jay_peg", 1, 100)
            const contextData: WorkContextData = {
                initialized: true,
                work,
            }
            setWorkContext(contextData)
        }
        getAndSetWork()
    })

    return (
        <></>
        //<workContext.Provider value={workContext}>
        //    {children}
        //</workContext.Provider>
    )
}
