import { FC } from 'react'

import { LinkButton } from '../../ui-button'
import { SocialShareFb } from '../../svgs'

interface FacebookSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const FacebookSocialShareBtn: FC<FacebookSocialShareBtnProps> = (props: FacebookSocialShareBtnProps) => (

    <LinkButton
        className={props.className}
        icon={SocialShareFb}
        to={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.shareUrl)}&src=share_button`}
        target='_blank'
        size='lg'
    />
)

export default FacebookSocialShareBtn
