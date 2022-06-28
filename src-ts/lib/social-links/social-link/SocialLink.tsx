import { FC, SVGProps } from 'react'
interface SocialLinkProps {
    readonly icon: FC<SVGProps<SVGSVGElement>>
    url: string
}

const SocialLink: FC<SocialLinkProps> = (props: SocialLinkProps) => {

    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = props.icon

    if (!Icon) {
        return <></>
    }

    return (
        <a href={props.url} target='_blank' rel='noreferrer'>
            <Icon />
        </a>
    )
}

export default SocialLink
