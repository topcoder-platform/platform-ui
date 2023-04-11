import { FC } from 'react'

import { Button } from '../../button'
import { SocialShareFb } from '../../svgs'

interface FacebookSocialShareBtnProps {
    className?: string
    shareUrl: string
}

const FacebookSocialShareBtn: FC<FacebookSocialShareBtnProps> = (props: FacebookSocialShareBtnProps) => (
    <Button
        className={props.className}
        icon={SocialShareFb}
        url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.shareUrl)}&src=share_button`}
        target='_blank'
        buttonStyle='icon'
    />
)

export default FacebookSocialShareBtn
