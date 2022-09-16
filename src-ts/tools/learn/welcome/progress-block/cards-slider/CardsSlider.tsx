import classNames from 'classnames'
import { fill } from 'lodash'
import { Children, Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import styles from './CardsSlider.module.scss'

interface CardsSliderProps {
    children: Array<JSX.Element>
}

const CardsSlider: FC<CardsSliderProps> = (props: CardsSliderProps) => {
    const [activeSlide, setActiveSlide]: [number, Dispatch<SetStateAction<number>>] = useState(2)

    const wrapSlides: (children: Array<JSX.Element>) => Array<JSX.Element> = (children: Array<JSX.Element>) => {
        return Children.map<ReactNode, ReactNode>(children, (child, index) => (
            <div
                className={
                    classNames(
                        styles.slide,
                        activeSlide === index && 'active',
                        activeSlide > index && 'is-prev',
                        activeSlide < index && 'is-next',
                    )
                }
            >
                {child}
            </div>
        )) as Array<JSX.Element>
    }

    return (
        <div className={styles.wrap}>
            <div className={styles['slides-wrap']}>
                {wrapSlides(props.children)}
            </div>
            <div className={styles['nav-wrap']}>
                {fill(Array(props.children.length), '').map((_, i) => (
                    <span
                        key={i}
                        className={classNames(styles['nav-dot'], activeSlide === i && 'active')}
                        onClick={() => setActiveSlide(i)}
                    />
                ))}
            </div>
        </div>
    )
}

export default CardsSlider
