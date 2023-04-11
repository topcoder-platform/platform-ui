import { FC } from 'react'

import { Button } from '../../button'
import { SocialShareLinkedIn } from '../../svgs'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => (
    <Button
        className={props.className}
        icon={SocialShareLinkedIn}
        url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.shareUrl)}`}
        target='_blank'
        buttonStyle='icon'
    />
)

export default TwitterSocialShareBtn
