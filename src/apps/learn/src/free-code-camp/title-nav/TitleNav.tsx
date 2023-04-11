import { FC } from 'react'

import { IconSolid } from '~/libs/ui'

import styles from './TitleNav.module.scss'

interface TitleNavProps {
    currentStep: number
    maxStep: number
    onNavigate: (direction: 1|-1) => void
    title?: string
}

const TitleNav: FC<TitleNavProps> = (props: TitleNavProps) => {
    function navigateBack(): void {
        props.onNavigate(-1)
    }

    function navigateForward(): void {
        props.onNavigate(1)
    }

    return (
        <div className={styles.wrap}>
            <h1 className='details'>
                {props.title}
            </h1>

            <div className={styles['nav-wrap']}>
                <span className='overline'>
                    <span className={styles.current}>{props.currentStep}</span>
                    <span> / </span>
                    <span>{props.maxStep}</span>
                </span>
                <div className={styles['nav-btns']}>
                    <div
                        className={styles['nav-btn']}
                        onClick={navigateBack}
                    >
                        <IconSolid.ChevronLeftIcon />
                    </div>
                    <div
                        className={styles['nav-btn']}
                        onClick={navigateForward}
                    >
                        <IconSolid.ChevronRightIcon />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TitleNav
