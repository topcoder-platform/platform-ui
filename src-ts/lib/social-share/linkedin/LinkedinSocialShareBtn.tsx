import { FC } from 'react'

import { SocialShareLinkedIn } from '../../svgs'
import { SocialShareBtn } from '../social-share-btn'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => {

    return (
        <SocialShareBtn
            className={props.className}
            icon={SocialShareLinkedIn}
            url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.shareUrl)}`}
        />
    )
}

export default TwitterSocialShareBtn
