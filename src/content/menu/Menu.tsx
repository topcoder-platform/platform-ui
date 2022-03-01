import { FC } from 'react'
import { Link } from 'react-router-dom'

import ContentLayout from '../../lib/content-layout/ContentLayout'
import { UiRoute } from '../../lib/urls'

import styles from './Menu.module.scss'

const Menu: FC<{}> = () => {

    const routes: UiRoute = new UiRoute()

    /* TODO: make configurable */
    const tools: Array<{
        route: string
        title: string
    }> = [
            {
                route: routes.home,
                title: 'Home',
            },
            {
                route: routes.designLib,
                title: 'Design Library',
            },
            {
                route: routes.selfService,
                title: 'Self Service',
            },
            {
                route: routes.tool,
                title: 'Tool',
            },
        ]

    const menuItems: Array<JSX.Element> = tools
        .map(tool => {
            return (
                <Link to={tool.route} className={styles['menu-selector']} key={tool.route}>
                    <div>
                        {tool.title}
                    </div>
                    <div>
                        {/* TODO: create an svg file */}
                        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M6 3.33329L10.6667 7.99996L6 12.6666' stroke='white' strokeWidth='1.13' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                    </div>
                </Link>
            )
        })
    return (
        <ContentLayout classNames='bg-black-100'>
            <span className={styles.menu}>
                {menuItems}
            </span>
        </ContentLayout>
    )
}

export default Menu
