import { FC } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let tcUniNav: any

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
