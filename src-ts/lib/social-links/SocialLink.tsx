import { FC } from 'react'

import {
    SocialIconFacebook,
    SocialIconInstagram,
    SocialIconLinkedin,
    SocialIconTwitter,
    SocialIconYoutube,
} from '../svgs'

export const SocialLinkIcons: object = {
    facebook: SocialIconFacebook,
    instagram: SocialIconInstagram,
    linkedin: SocialIconLinkedin,
    twitter: SocialIconTwitter,
    youtube: SocialIconYoutube,
}

interface SocialLinkProps {
    icon: keyof typeof SocialLinkIcons
    url: string
}

const SocialLink: FC<SocialLinkProps> = ({
    icon,
    url,
}: SocialLinkProps) => {
    const Icon: FC<any> = SocialLinkIcons[icon]

    if (!Icon) {
        return <></>
    }

    return (
        <a href={url} target='_blank'>
            <Icon />
        </a>
    )
}

export default SocialLink
