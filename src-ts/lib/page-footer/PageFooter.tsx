import { FC } from 'react'
import type { TcUniNavFn } from 'universal-navigation'

declare let tcUniNav: TcUniNavFn

const PageFooter: FC<{}> = () => {

    const navElementId: string = 'footer-nav-el'

    // delay the initialization so
    // the nav element has time to render
    setTimeout(() => {
        tcUniNav(
            'init',
            navElementId,
            {
                type: 'footer',
            },
        )
    }, 10)

    return <></>
}

export default PageFooter
