import { FC } from 'react'

import { SocialIconLinkedIn } from '../../svgs'
import { SocialLink } from '../social-link'

const LinkedIn: FC<{}> = () => (
    <SocialLink
        icon={SocialIconLinkedIn}
        url='https://www.linkedin.com/company/topcoder'
    />
)

export default LinkedIn
