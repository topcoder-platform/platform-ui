import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { getMyWork, MyWorkList } from './'
import { MyWorkContext, defaultMyWorkContextData } from './mywork.context'
import { MyWorkContextData } from './mywork-context-data.model'

export const MyWorkProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

    const [myWorkContext, setMyWorkContext]: [MyWorkContextData, Dispatch<SetStateAction<MyWorkContextData>>]
        = useState<MyWorkContextData>(defaultMyWorkContextData)

    useEffect(() => {
        console.log("********** getting my work!")
        if (myWorkContext.initialized) {
            return
        }

        // need pages
        const getAndSetMyWork: () => Promise<void> = async () => {
            const myWork: MyWorkList | undefined = await getMyWork()
            const contextData: MyWorkContextData = {
                initialized: true,
                myWork,
            }
            setMyWorkContext(contextData)
        }
        getAndSetMyWork()
    })

    return (
        <MyWorkContext.Provider value={myWorkContext}>
            {children}
        </MyWorkContext.Provider>
    )
}
