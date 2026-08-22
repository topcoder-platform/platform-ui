import {
    FC,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { OpportunityView } from './models'
import {
    opportunityViewContext,
    OpportunityViewContextData,
} from './opportunities.context'
import { toolTitle } from './opportunities.routes'
import './styles/index.scss'

/**
 * Hosts nested Opportunities routes and scopes the 2026 design system to this app.
 *
 * @returns the active child page and its nested Router elements.
 * @throws Does not throw.
 */
const OpportunitiesApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])
    const [view, setView] = useState<OpportunityView>('list')
    const viewContext = useMemo<OpportunityViewContextData>(() => ({
        onViewChange: setView,
        view,
    }), [view])

    useEffect(() => {
        document.body.classList.add('opportunities-page')
        return () => document.body.classList.remove('opportunities-page')
    }, [])

    return (
        <opportunityViewContext.Provider value={viewContext}>
            <div className='opportunities-app tc-2026'>
                <Outlet />
                <Routes>{childRoutes}</Routes>
            </div>
        </opportunityViewContext.Provider>
    )
}

export default OpportunitiesApp
