import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { AiFeedbackItem, Scorecard } from '../../../models'

export interface ScorecardViewerContextProps {
    children: ReactNode;
    scorecard: Scorecard
    aiFeedbackItems?: AiFeedbackItem[]
}

export type ScorecardViewerContextValue = {
    aiFeedbackItems?: AiFeedbackItem[]
    toggledItems: {[key: string]: boolean}
    toggleItem: (id: string) => void
};

const ScorecardViewerContext = createContext({} as ScorecardViewerContextValue)

export const ScorecardViewerContextProvider: FC<ScorecardViewerContextProps> = props => {
    const [toggledItems, setToggledItems] = useState<{[key: string]: boolean}>({})

    const toggleItem = useCallback((id: string, toggle?: boolean) => {
        setToggledItems(prevItems => ({
            ...prevItems,
            [id]: typeof toggle === 'boolean' ? toggle : !prevItems[id],
        }))
    }, [])

    // reset toggle state on scorecard change
    useEffect(() => setToggledItems({}), [props.scorecard])

    const ctxValue = useMemo(() => ({
        aiFeedbackItems: props.aiFeedbackItems,
        toggledItems,
        toggleItem,
    }), [
        props.aiFeedbackItems,
        toggledItems,
        toggleItem,
    ])

    return (
        <ScorecardViewerContext.Provider
            value={ctxValue}
        >
            {props.children}
        </ScorecardViewerContext.Provider>
    )
}

export const useScorecardContext = (): ScorecardViewerContextValue => useContext(ScorecardViewerContext)
