import classNames from 'classnames'
import { FC, ReactNode, SVGProps } from 'react'

import { ButtonStyle } from '../button'
import '../styles/index.scss'

export interface CardProps {
    buttonStyle?: ButtonStyle
    children: ReactNode
    icon?: FC<SVGProps<SVGSVGElement>>
    onClick?: () => void
    title: string
}

const Card: FC<CardProps> = (props: CardProps) => {

    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = props.icon

    return (
        <div
            className={classNames('card', !!props.onClick ? 'clickable' : undefined, props.buttonStyle)}
            onClick={props.onClick}
        >

            <div className='card-title'>
                <h3 className='body-medium-bold'>
                    {props.title}
                </h3>
                {!!Icon && <Icon />}
            </div>

            {props.children}

        </div>
    )
}

export default Card
