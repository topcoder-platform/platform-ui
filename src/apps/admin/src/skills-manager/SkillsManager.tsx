import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { skillsManagerRoutes } from './skills-manager.routes'

const SkillsManager: FC<{}> = () => {
    const { getRouteElement }: RouterContextData = useContext(routerContext)

    return (
        <>
            <Outlet />
            <Routes>
                {skillsManagerRoutes.map(getRouteElement)}
            </Routes>
        </>
    )
}

export default SkillsManager
