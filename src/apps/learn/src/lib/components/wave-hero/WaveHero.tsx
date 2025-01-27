import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './WaveHero.module.scss'

interface WaveHeroProps {
    children?: ReactNode
    text: string
    theme?: 'light' | 'grey'
    title: ReactNode
}

const WaveHero: FC<WaveHeroProps> = (props: WaveHeroProps) => (
    <div className={classNames(styles['hero-wrap'], props.theme)}>
        <div className={styles['hero-inner']}>
            <div
                className={
                    classNames(
                        'hero-content',
                        styles['hero-content'],
                    )
                }
            >
                <div className={styles['hero-text-col']}>
                    <h1>{props.title}</h1>
                    <p
                        className={styles['hero-text']}
                        dangerouslySetInnerHTML={{ __html: props.text || '' }}
                    />
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

export default WaveHero
