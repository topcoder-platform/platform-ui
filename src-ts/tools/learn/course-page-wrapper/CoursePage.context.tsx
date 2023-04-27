import { Context, createContext, FC, ReactNode, useCallback, useContext, useMemo } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'
import { pick } from 'lodash'

import { rootRoute } from '../learn.routes'
import { BreadcrumbItemModel } from '../../../lib'

export interface CoursePageContextProviderProps {
    children: ReactNode
}

export interface CoursePageContextValue {
    buildBreadcrumbs: (items: BreadcrumbItemModel[]) => BreadcrumbItemModel[]
    localNavigate: NavigateFunction
    navState: { tcaCertInfo: BreadcrumbItemModel } | undefined
}

const CoursePageContext: Context<CoursePageContextValue> = createContext(
    {} as CoursePageContextValue,
)

/**
 * Page context provider for Course pages: details, fcc, completed
 *
 * It keeps into account the navigation path the user took to get here
 *
 * Eg. if user clicked the course directly, there's nothing to do, but
 * if the user clicked the course from inside the TCA certification page
 * we need to show an extra breadcrumb specific to TCA certification page
 */

export const CoursePageContextProvider: FC<CoursePageContextProviderProps> = props => {
    const location: any = useLocation()
    const navigate: NavigateFunction = useNavigate()

    const parentTcaCert: BreadcrumbItemModel | undefined = useMemo(() => (
        (
            location.state
            && Object.prototype.hasOwnProperty.call(location.state, 'tcaCertInfo')
            && location.state.tcaCertInfo && pick(location.state.tcaCertInfo, ['name', 'url'])
        ) || undefined
    ), [location.state])

    const buildBreadcrumbs: (items: BreadcrumbItemModel[]) => BreadcrumbItemModel[]
        = useCallback(items => {
            const breadcrumbs: BreadcrumbItemModel[] = [
                {
                    name: 'Topcoder Academy',
                    url: rootRoute,
                },
                ...(!parentTcaCert ? [] : [parentTcaCert]),
                ...items,
            ]

            return !parentTcaCert ? breadcrumbs : breadcrumbs.map(item => Object.assign(item, {
                state: { tcaCertInfo: pick(parentTcaCert, ['name', 'url']) },
            }))
        }, [parentTcaCert])

    const localNavigate: NavigateFunction = useCallback((to, options) => (
        navigate(to, {
            ...options,
            state: {
                ...options?.state,
                tcaCertInfo: parentTcaCert,
            },
        })
    ), [navigate, parentTcaCert]) as NavigateFunction

    const ctxValue: CoursePageContextValue = useMemo(() => ({
        buildBreadcrumbs,
        localNavigate,
        navState: parentTcaCert ? { tcaCertInfo: parentTcaCert } : undefined,
    }), [
        buildBreadcrumbs,
        localNavigate,
        parentTcaCert,
    ])

    return (
        <CoursePageContext.Provider
            value={ctxValue}
        >
            {props.children}
        </CoursePageContext.Provider>
    )
}

export const useCoursePageContext: () => CoursePageContextValue
    = () => useContext(CoursePageContext)
