import { FC } from 'react'

import { SocialIconInstagram } from '../../svgs'
import { SocialLink } from '../social-link'

const Instagram: FC<{}> = () => {

    return (
        <SocialLink
            icon={SocialIconInstagram}
            url='https://www.instagram.com/topcoder'
        />
    )
}

export default Instagram
