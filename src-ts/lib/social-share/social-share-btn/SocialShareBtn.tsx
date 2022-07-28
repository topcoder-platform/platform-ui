import { FC, SVGProps } from 'react'

interface SocialShareBtnProps {
    className?: string
    readonly icon: FC<SVGProps<SVGSVGElement>>
    url: string
}

const SocialShareBtn: FC<SocialShareBtnProps> = (props: SocialShareBtnProps) => {

    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = props.icon

    if (!Icon) {
        return <></>
    }

    return (
        <a className={props.className} href={props.url} target='_blank' rel='noreferrer'>
            <Icon />
        </a>
    )
}

export default SocialShareBtn
