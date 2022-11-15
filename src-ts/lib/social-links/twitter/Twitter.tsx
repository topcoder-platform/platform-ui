import { FC } from 'react'

import { SocialIconTwitter } from '../../svgs'
import { SocialLink } from '../social-link'

const Twitter: FC<{}> = () => (
    <SocialLink
        icon={SocialIconTwitter}
        url='https://twitter.com/topcoder'
    />
)

export default Twitter
