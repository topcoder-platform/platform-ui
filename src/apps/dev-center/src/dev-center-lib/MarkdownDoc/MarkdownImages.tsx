import * as React from 'react'
import { identity } from 'lodash'
import Carousel from 'react-elastic-carousel'

import { Button, IconSolid } from '~/libs/ui'

import styles from './MarkdownImages.module.scss'
import './MarkdownImages.css'

interface MarkdownImagesProps {
    children: Array<React.ReactNode>
    length: number
}

interface CarouselButtonProps {
    active: boolean
    onClick: (ev: any) => void
}

const CarouselButton: React.FC<CarouselButtonProps> = props => (
    <button
        aria-label='Page'
        type='button'
        className={`${styles.indicator} ${
            props.active ? styles.active : ''
        }`}
        onClick={props.onClick}
    />
)

const MarkdownImages: React.FC<MarkdownImagesProps> = props => {
    const carouselRef: React.MutableRefObject<any> = React.useRef()

    function handlePrev(): void {
        carouselRef?.current?.slidePrev()
    }

    function handleNext(): void {
        carouselRef?.current?.slideNext()
    }

    interface RenderPaginationProps {
        activePage: number
        onClick: (ev: any) => void
        pages: Array<any>
    }

    function renderPagination({
        pages,
        activePage,
        onClick,
    }: RenderPaginationProps): JSX.Element {
        return (
            <div className={styles.footer}>
                <Button
                    size='xl'
                    className={styles.prev}
                    icon={IconSolid.ChevronLeftIcon}
                    disabled={carouselRef?.current?.state.activePage === 0}
                    onClick={handlePrev}
                />
                {pages.map(page => {
                    const isActivePage: boolean = activePage === page
                    return (
                        <CarouselButton
                            key={page}
                            onClick={function handleBtnClick() { onClick(page) }}
                            active={isActivePage}
                        />
                    )
                })}
                <Button
                    size='xl'
                    className={styles.next}
                    icon={IconSolid.ChevronRightIcon}
                    disabled={
                        carouselRef?.current?.state.activePage === props.length - 1
                    }
                    onClick={handleNext}
                />
            </div>
        )
    }

    return props.children.length > 1 ? (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <Carousel
            itemsToShow={1}
            showArrows={false}
            isRTL={false}
            ref={carouselRef}
            className={styles.imagesBlock}
            renderPagination={renderPagination}
        >
            {props.children.map((image, index) => (
                <div
                    key={identity(`md-image-${index}`)}
                    className={styles.imageContainer}
                >
                    {image}
                </div>
            ))}
        </Carousel>
    ) : (
        <>
            <div key='md-image-single' className={`${styles.imageBlock}}`}>
                <div className={styles.imageContainer}>{props.children[0]}</div>
            </div>
        </>
    )
}

export default MarkdownImages
