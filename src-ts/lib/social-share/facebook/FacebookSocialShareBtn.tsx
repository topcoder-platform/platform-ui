import { FC } from 'react'

import { SocialShareFb } from '../../svgs'
import { SocialShareBtn } from '../social-share-btn'

interface FacebookSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const FacebookSocialShareBtn: FC<FacebookSocialShareBtnProps> = (props: FacebookSocialShareBtnProps) => {

    return (
        <SocialShareBtn
            className={props.className}
            icon={SocialShareFb}
            url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.shareUrl)}&src=share_button`}
        />
    )
}

export default FacebookSocialShareBtn
