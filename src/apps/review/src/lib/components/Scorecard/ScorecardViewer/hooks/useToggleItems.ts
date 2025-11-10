import { useCallback, useEffect, useState } from 'react'

import { Scorecard, ScorecardInfo } from '../../../../models'

interface UseToggleItemsProps {
    scorecard: Scorecard | ScorecardInfo
}

export interface UseToggleItemsValue {
    toggledItems: {[key: string]: boolean}
    toggleItem: (id: string, toggle?: boolean) => void
}

export const useToggleItems = (props: UseToggleItemsProps): UseToggleItemsValue => {
    const [toggledItems, setToggledItems] = useState<{[key: string]: boolean}>({})

    const toggleItem = useCallback((id: string, toggle?: boolean) => {
        setToggledItems(prevItems => ({
            ...prevItems,
            [id]: typeof toggle === 'boolean' ? toggle : !prevItems[id],
        }))
    }, [])

    // Reset toggle state on scorecard change
    useEffect(() => {
        setToggledItems({})
    }, [props.scorecard])

    return {
        toggledItems,
        toggleItem,
    }
}
