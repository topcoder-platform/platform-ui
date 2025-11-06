import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AiFeedbackItem, Scorecard } from '../../../models';
import { isEmpty } from 'lodash';

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

const ScorecardViewerContext = createContext({} as ScorecardViewerContextValue);


export function ScorecardViewerContextProvider({
    children,
    aiFeedbackItems,
    scorecard,
    ...props
}: ScorecardViewerContextProps) {
    const [toggledItems, setToggledItems] = useState<{[key: string]: boolean}>({});

    const toggleItem = useCallback((id: string, toggle?: boolean) => {
        setToggledItems((prevItems) => ({
            ...prevItems,
            [id]: typeof toggle === 'boolean' ? toggle : !prevItems[id],
        }))
    }, []);

    // reset toggle state on scorecard change
    useEffect(() => setToggledItems({}), [scorecard]);

    return (
        <ScorecardViewerContext.Provider
            value={{
                aiFeedbackItems,
                toggledItems,
                toggleItem,
            }}
            {...props}
        >
            {children}
        </ScorecardViewerContext.Provider>
    );
};

export const useScorecardContext = () => useContext(ScorecardViewerContext);
