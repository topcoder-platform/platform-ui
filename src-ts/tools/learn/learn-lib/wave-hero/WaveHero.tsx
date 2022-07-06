import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import styles from './WaveHero.module.scss'

interface WaveHeroProps {
    children?: ReactNode
    text: string
    theme?: 'light'
    title: string
}

const WaveHero: FC<WaveHeroProps> = (props: WaveHeroProps) => {

    return (
        <div className={classNames(styles['hero-wrap'], props.theme)}>
            <div className={styles['hero-inner']}>
                <div className={styles['hero-content']}>
                    <div className={styles['hero-text-col']}>
                        <h1>{props.title}</h1>
                        <p className={styles['hero-text']}>
                            {props.text}
                        </p>
                    </div>
                    {props.children && (
                        <div className={classNames(styles['hero-card-col'], 'hero-card-col')}>
                            {props.children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WaveHero
