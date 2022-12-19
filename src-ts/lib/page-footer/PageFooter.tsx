import { FC } from 'react'
import type { TcUniNavFn } from 'universal-navigation'

declare let tcUniNav: TcUniNavFn

const PageFooter: FC<{}> = () => {

    const navElementId: string = 'footer-nav-el'

    tcUniNav(
        'init',
        navElementId,
        {
            type: 'footer',
        },
    )

    return <div id={navElementId} />
}

export default PageFooter
