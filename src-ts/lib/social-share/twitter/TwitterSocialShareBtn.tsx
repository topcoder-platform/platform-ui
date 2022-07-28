import { FC } from 'react'

import { SocialShareTwitter } from '../../svgs'
import { SocialShareBtn } from '../social-share-btn'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => {

    return (
        <SocialShareBtn
            className={props.className}
            icon={SocialShareTwitter}
            url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(props.shareUrl)}`}
        />
    )
}

export default TwitterSocialShareBtn
