import { Context, createContext } from 'react'

import { RouteContextData } from './route-context-data.model'

export const defaultRouteContextData: RouteContextData = {
    routes: [],
}

const RouteContext: Context<RouteContextData> = createContext(defaultRouteContextData)

export default RouteContext
