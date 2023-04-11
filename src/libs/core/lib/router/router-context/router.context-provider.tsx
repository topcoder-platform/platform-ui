import {
    Dispatch,
    FC,
    ReactElement,
    ReactNode,
    SetStateAction,
    Suspense,
    useContext,
    useEffect,
    useState,
} from 'react'
import { Location, Route, useLocation } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import { authUrlLogin } from '../../auth'
import RestrictedRoute from '../restricted.route'
import { routeGetActive, routeGetSignupUrl } from '../routes-functions'
import { PlatformRoute } from '../platform-route.model'
import { profileContext, ProfileContextData } from '../../profile'

import {
    RouterContextData,
    routerContext,
    routerContextDefaultData,
} from './router.context'

interface RouterProviderProps {
    children: ReactNode
    rootCustomer: string
    rootLoggedOut: string
    rootMember: string
    allRoutes: Array<PlatformRoute>
}

export const RouterProvider: FC<RouterProviderProps> = (props: RouterProviderProps) => {

    const { initialized, profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const [routeContextData, setRouteContextData]: [RouterContextData, Dispatch<SetStateAction<RouterContextData>>]
        = useState<RouterContextData>(routerContextDefaultData)

    const location: Location = useLocation()

    let allRoutes: Array<PlatformRoute> = []

    function getAndSetRoutes(): void {

        allRoutes = props.allRoutes.filter(route => !route.disabled)

        const activeRoute: PlatformRoute | undefined = routeGetActive(location.pathname, allRoutes)

        // TODO: support additional roles and landing pages
        const loggedInRoot: string = !profile
            ? ''
            : profile.isCustomer
                ? props.rootCustomer
                : props.rootMember

        const contextData: RouterContextData = {
            activeToolName: activeRoute?.title || activeRoute?.id,
            activeToolRoute: !!activeRoute ? `https://${window.location.hostname}${activeRoute.route}` : undefined,
            allRoutes,
            getChildren,
            getChildRoutes,
            getPathFromRoute,
            getRouteElement,
            getSignupUrl: routeGetSignupUrl,
            initialized,
            isRootRoute: isRootRoute(loggedInRoot, props.rootLoggedOut),
            rootLoggedInRoute: loggedInRoot,
            rootLoggedOutRoute: props.rootLoggedOut,
        }
        setRouteContextData(contextData)
    }

    function getChildren(parent: string): Array<PlatformRoute> {
        return allRoutes
            .find(route => route.id === parent)
            ?.children
            || []
    }

    function getChildRoutes(parent: string): Array<ReactElement> {
        return getChildren(parent)
            .map(route => getRouteElement(route))
    }

    function getPathFromRoute(route: PlatformRoute): string {
        return route.route.replace('/*', '')
    }

    function getRouteElement(route: PlatformRoute): JSX.Element {

        // create the route element
        const routeElement: JSX.Element = !route.authRequired
            ? route.element
            : (
                <RestrictedRoute loginUrl={authUrlLogin()} rolesRequired={route.rolesRequired}>
                    {route.element}
                </RestrictedRoute>
            )

        // if the route has children, add the wildcard to the path
        const path: string = `${route.route}${!route.children?.length ? '' : '/*'}`

        // return the route
        return (
            <Route
                element={routeElement}
                key={route.route}
                path={path}
            />
        )
    }

    useEffect(() => {
        getAndSetRoutes()
        // THIS WILL BE FIXED IN https://github.com/topcoder-platform/platform-ui/tree/PROD-2321_bug-hunt-intake-form
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        initialized,
        location,
        profile,
        props.allRoutes,
    ])

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <routerContext.Provider value={routeContextData}>
                {props.children}
            </routerContext.Provider>
        </Suspense>
    )
}

function isRootRoute(rootLoggedIn: string | undefined, rootLoggedOut: string): (activePath: string) => boolean {
    return (activePath: string) => [rootLoggedIn, rootLoggedOut].some(route => activePath === route)
}
