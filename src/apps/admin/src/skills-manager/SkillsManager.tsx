import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { skillsManagerRoutes } from './skills-manager.routes'
import { SkillsManagerContext } from './context'

const SkillsManager: FC<{}> = () => {
    const { getRouteElement }: RouterContextData = useContext(routerContext)

    return (
        <SkillsManagerContext>
            <Outlet />
            <Routes>
                {skillsManagerRoutes.map(getRouteElement)}
            </Routes>
        </SkillsManagerContext>
    )
}

export default SkillsManager
