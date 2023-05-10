import { FC, ReactElement, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { learnRoutes } from '../learn.routes'

import { CoursePageContextProvider } from './CoursePage.context'

const CoursePageWrapper: FC<{}> = () => {
    const { getRouteElement }: RouterContextData = useContext(routerContext)

    // Get all the CoursePage child routes and render them as a route element
    const childRoutes: ReactElement[] = useMemo(() => (
        learnRoutes[0].children?.find(route => route.id === 'CoursePage')?.children ?? []
    ).map(getRouteElement), [getRouteElement])

    return (
        <CoursePageContextProvider>
            <Outlet />
            <Routes>
                {childRoutes}
            </Routes>
        </CoursePageContextProvider>
    )
}

export default CoursePageWrapper
