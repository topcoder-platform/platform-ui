import { FC } from 'react'

import { SocialIconYoutube } from '../../svgs'
import { SocialLink } from '../social-link'

const Youtube: FC<{}> = () => {

    return (
        <SocialLink
            icon={SocialIconYoutube}
            url='https://www.youtube.com/channel/UCFv29ANLT2FQmtvS9DRixNA'
        />
    )
}

export default Youtube
