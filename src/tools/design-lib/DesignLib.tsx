import { FC } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import { ContentLayout } from '../../lib'

import { Buttons } from './buttons'
import { default as DesignLibRouteConfig } from './design-lib-route.config'
import styles from './DesignLib.module.scss'
import { Fonts } from './fonts'
import { Home } from './home'
import { Icons } from './icons'
import { sections } from './sections.config'

const DesignLib: FC<{}> = () => {
    return (
        <>
            <ContentLayout classNames={styles['design-lib']} sections={sections}>
                <>
                    <h1>Design Library</h1>
                    <Outlet />
                    <Routes>
                        <Route path={''} element={<Home />} />
                        <Route path={DesignLibRouteConfig.buttons} element={<Buttons />} />
                        <Route path={DesignLibRouteConfig.fonts} element={<Fonts />} />
                        <Route path={DesignLibRouteConfig.icons} element={<Icons />} />
                    </Routes>
                </>
            </ContentLayout>
        </>
    )
}

export default DesignLib
