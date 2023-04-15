import { FC } from 'react'

import { LinkButton } from '../../ui-button'
import { SocialShareTwitter } from '../../svgs'

interface TwitterSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const TwitterSocialShareBtn: FC<TwitterSocialShareBtnProps> = (props: TwitterSocialShareBtnProps) => (
    <LinkButton
        className={props.className}
        icon={SocialShareTwitter}
        to={`https://twitter.com/intent/tweet?url=${encodeURIComponent(props.shareUrl)}`}
        target='_blank'
        size='lg'
    />
)

export default TwitterSocialShareBtn
