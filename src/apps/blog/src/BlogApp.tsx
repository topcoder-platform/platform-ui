import type { FC } from 'react'
import { useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import type { RouterContextData } from '~/libs/core'
import { routerContext } from '~/libs/core'

import { toolTitle } from './blog.routes'

/**
 * Hosts Blog's nested routes and scopes the active body class to the sub-application lifetime.
 *
 * @returns the active Blog route.
 * @throws Does not throw.
 */
const BlogApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('blog-app')
        return () => document.body.classList.remove('blog-app')
    }, [])

    return (
        <>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </>
    )
}

export default BlogApp
