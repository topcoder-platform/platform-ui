import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ContentLayout, RouteContext, RouteContextData } from '../../lib'

import styles from './DesignLib.module.scss'

export const toolTitle: string = 'Design Library'

const DesignLib: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(RouteContext)

    return (
        <ContentLayout classNames={styles['design-lib']} title={toolTitle}>
            <>
                <Outlet />
                <Routes>
                    {getChildRoutes(toolTitle)}
                </Routes>
            </>
        </ContentLayout>
    )
}

export default DesignLib
