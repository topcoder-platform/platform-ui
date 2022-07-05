import {
    Dispatch,
    FC,
    ReactElement,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react'
import { Route } from 'react-router-dom'

import { authUrlLogin } from '../functions'
import { profileContext, ProfileContextData } from '../profile-provider'

import { PlatformRoute } from './platform-route.model'
import { RequireAuthProvider } from './require-auth-provider'
import { RouteContextData } from './route-context-data.model'
import { default as routeContext, defaultRouteContextData } from './route.context'

interface RouteProviderProps {
    children: ReactNode
    rootCustomer: string
    rootLoggedOut: string
    rootMember: string
    toolsRoutes: Array<PlatformRoute>
    utilsRoutes: Array<PlatformRoute>
}

export const RouteProvider: FC<RouteProviderProps> = (props: RouteProviderProps) => {

    const { profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const [routeContextData, setRouteContextData]: [RouteContextData, Dispatch<SetStateAction<RouteContextData>>]
        = useState<RouteContextData>(defaultRouteContextData)

    let allRoutes: Array<PlatformRoute> = []

    function getAndSetRoutes(): void {

        // TODO: try to make these prop names configurable instead of hard-codded
        const toolsRoutes: Array<PlatformRoute> = props.toolsRoutes.filter(route => !route.disabled)
        const toolsRoutesForNav: Array<PlatformRoute> = toolsRoutes
            .filter(route =>
                !route.hide
                && (!route.customerOnly || !!profile?.isCustomer)
                && (!route.memberOnly || !!profile?.isMember)
                // TODO || tool is active PROD-2390
            )
        const utilsRoutes: Array<PlatformRoute> = props.utilsRoutes.filter(route => !route.disabled)
        allRoutes = [
            ...toolsRoutes,
            ...utilsRoutes,
        ]
        // TODO: support additional roles and landing pages
        const loggedInRoot: string = !!profile?.isCustomer ? props.rootCustomer : props.rootMember
        const contextData: RouteContextData = {
            allRoutes,
            getChildRoutes,
            getChildren,
            getPath,
            getPathFromRoute,
            getRouteElement,
            isActiveRoute,
            isRootRoute: isRootRoute(loggedInRoot, props.rootLoggedOut),
            rootLoggedInRoute: loggedInRoot,
            rootLoggedOutRoute: props.rootLoggedOut,
            toolsRoutes,
            toolsRoutesForNav,
            utilsRoutes,
        }
        setRouteContextData(contextData)
    }

    function getChildren(parent: string): Array<PlatformRoute> {
        return allRoutes
            .find(route => route.title === parent)
            ?.children
            || []
    }

    function getChildRoutes(parent: string): Array<ReactElement> {
        return getChildren(parent)
            .map(route => getRouteElement(route))
    }

    function getPath(routeTitle: string): string {
        const platformRoute: PlatformRoute = allRoutes.find(route => route.title === routeTitle) as PlatformRoute
        // if the path has a trailing asterisk, remove it
        return getPathFromRoute(platformRoute)
    }

    function getPathFromRoute(route: PlatformRoute): string {
        return route.route.replace('/*', '')
    }

    function getRouteElement(route: PlatformRoute): JSX.Element {

        // create the route element
        const routeElement: JSX.Element = !route.requireAuth
            ? route.element
            : (
                <RequireAuthProvider loginUrl={authUrlLogin}>
                    {route.element}
                </RequireAuthProvider>
            )

        // if the route has children, add the wildcard to the path
        const path: string = `${route.route}${!route.children?.length ? '' : '/*'}`

        // return the route
        return (
            <Route
                element={routeElement}
                key={route.title}
                path={path}
            />
        )
    }

    useEffect(() => {
        getAndSetRoutes()
    }, [
        profile,
        props.toolsRoutes,
        props.utilsRoutes,
    ])

    return (
        <routeContext.Provider value={routeContextData}>
            {props.children}
        </routeContext.Provider>
    )
}

function isActiveRoute(activePath: string, toolRoute: PlatformRoute): boolean {
    return !!(
        activePath?.startsWith(toolRoute.route)
        || toolRoute.alternativePaths?.some(path => activePath?.startsWith(path))
    )
}

function isRootRoute(rootLoggedIn: string, rootLoggedOut: string):
    (activePath: string) => boolean {

    return (activePath: string) => {
        return [rootLoggedIn, rootLoggedOut].some(route => activePath === route)
    }
}
