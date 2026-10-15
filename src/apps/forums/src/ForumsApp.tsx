import { FC, useContext } from 'react'
import { Routes } from 'react-router-dom'

import { ToolTitle } from '~/config'
import { routerContext, RouterContextData } from '~/libs/core'

/** Renders the forum child routes supplied by the platform router on either host.
 * @returns The matching index, category, or thread page. @throws Does not throw.
 */
const ForumsApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return <Routes>{getChildRoutes(ToolTitle.forums)}</Routes>
}

export default ForumsApp
