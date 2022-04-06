import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'

import { WorkContextData } from './work-context-data.model'
import { workGetAsync, WorkList } from './work-functions'
import { default as workContext, defaultWorkContextData } from './work.context'

export const WorkProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [workContextData, setWorkContextData]: [WorkContextData, Dispatch<SetStateAction<WorkContextData>>]
        = useState<WorkContextData>(defaultWorkContextData)

    useEffect(() => {
        // tslint:disable-next-line: no-console // TODO: remove this console log
        console.log('******** getting my work')
        if (workContextData.initialized) {
            return
        }

        // need pages
        const getAndSetWork: () => Promise<void> = async () => {
            const work: WorkList | undefined = await workGetAsync('jay_peg', 1, 100)
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
