import { FC } from 'react'

import { ContentLayout, ProfileProps, SectionSelectorProps } from '../../lib'
import chatIcon from '../../lib/svg/chat.svg'
import mailIcon from '../../lib/svg/mail.svg'
import ticketIcon from '../../lib/svg/ticket.svg'

import { DesignLibRoute } from './design-lib-route.service'
import styles from './Design-Lib.module.scss'

const DesignLib: FC<ProfileProps> = (props: ProfileProps) => {

    const routes: DesignLibRoute = new DesignLibRoute()

    const sections: Array<SectionSelectorProps> = [
        {
            icon: mailIcon,
            route: routes.root,
            title: 'Home',
        },
        {
            icon: ticketIcon,
            route: routes.buttons,
            title: 'Buttons',
        },
        {
            icon: chatIcon,
            route: routes.fonts,
            title: 'Fonts',
        },
        {
            icon: mailIcon,
            route: routes.icons,
            title: 'Icons',
        },
    ]

    return (
        <ContentLayout profile={props.profile} classNames={styles['design-lib']} sections={sections}>
            <>
                Design Library
            </>
        </ContentLayout>
    )
}

export default DesignLib
