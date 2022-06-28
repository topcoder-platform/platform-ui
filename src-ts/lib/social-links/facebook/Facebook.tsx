import { FC } from 'react'

import { SocialIconFacebook } from '../../svgs'
import { SocialLink } from '../social-link'

const Facebook: FC<{}> = () => {

    return (
        <SocialLink
            icon={SocialIconFacebook}
            url='https://www.facebook.com/topcoder'
        />
    )
}

export default Facebook
