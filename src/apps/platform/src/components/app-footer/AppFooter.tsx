import { FC, MutableRefObject, useEffect, useRef } from 'react'

import { getTcUniNav } from '../../utils'

const APP_FOOTER_EL_ID: string = 'footer-nav-el'

const AppFooter: FC<{}> = () => {
    const footerInit: MutableRefObject<boolean> = useRef(false)

    // delay the initialization so
    // the nav element has time to render
    useEffect(() => {

        if (footerInit.current) {
            return
        }

        footerInit.current = true

        if (!document.getElementById(APP_FOOTER_EL_ID)) {
            return
        }

        getTcUniNav()?.(
            'init',
            APP_FOOTER_EL_ID,
            {
                type: 'footer',
            },
        )
    }, [])

    return (
        <div id={APP_FOOTER_EL_ID} />
    )
}

export default AppFooter
