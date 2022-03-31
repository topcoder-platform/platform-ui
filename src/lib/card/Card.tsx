import { FC, ReactNode, SVGProps } from 'react'

import styles from './Card.module.scss'

export interface CardProps {
    children: ReactNode
    icon?: FC<SVGProps<SVGSVGElement>>
    title: string
}

const Card: FC<CardProps> = (props: CardProps) => {

    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = props.icon

    return (
        <div className={styles.card}>

            <div className={styles['card-title']}>
                <div>
                    {props.title}
                </div>
                {!!Icon && <Icon />}
            </div>

            {props.children}

        </div>
    )
}

export default Card
