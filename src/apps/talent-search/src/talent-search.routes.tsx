/* eslint-disable max-len */
import React, { useLayoutEffect } from "react";
import { Provider } from "react-redux";

const TalentSearchAppRoot: LazyLoadedComponent = lazyLoad(() => import('./TalentSearchApp'));
const TalentSearch: LazyLoadedComponent = lazyLoad(() => import('./routes/talent-search/TalentSearch'));

import "./styles/main.vendor.scss";
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.talentSearch ? '' : `/${AppSubdomain.talentSearch}`
)

export const toolTitle: string = ToolTitle.talentSearch

export const talentSearchRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <TalentSearch />,
                route: '/',
            }, 
        ],
        domain: AppSubdomain.talentSearch,
        element: <TalentSearchAppRoot />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator
        ],
        route: rootRoute,
    },
]
