import { FC } from 'react'

import { LinkButton } from '../../button'
import { SocialShareLinkedIn } from '../../svgs'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => (
    <LinkButton
        className={props.className}
        icon={SocialShareLinkedIn}
        to={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(props.shareUrl)}`}
        target='_blank'
        size='lg'
    />
)

export default TwitterSocialShareBtn
