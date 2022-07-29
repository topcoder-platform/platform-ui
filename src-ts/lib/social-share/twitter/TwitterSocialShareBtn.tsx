import { FC } from 'react'
import { Button } from '../../button'

import { SocialShareTwitter } from '../../svgs'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => {

    return (
        <Button
            className={props.className}
            icon={SocialShareTwitter}
            url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(props.shareUrl)}`}
            target='_blank'
            buttonStyle='icon'
        />
    )
}

export default TwitterSocialShareBtn
