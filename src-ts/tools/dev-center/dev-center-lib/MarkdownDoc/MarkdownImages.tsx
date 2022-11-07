import * as React from 'react'
import Carousel from 'react-elastic-carousel'

import { Button, IconSolid } from '../../../../lib'

import './MarkdownImages.css'
import styles from './MarkdownImages.module.scss'

interface MarkdownImagesProps {
    children: Array<React.ReactNode>
    length: number
}

interface CarouselButtonProps {
    active: boolean
    onClick: (ev: any) => void
}

const CarouselButton: React.FC<CarouselButtonProps> = ({ onClick, active }) => (
    <button
        className={`${styles.indicator} ${
            active ? styles.active : ''
        }`}
        onClick={onClick}
    />
)

const MarkdownImages: React.FC<MarkdownImagesProps> = ({
    children,
    length,
}) => {
    const carouselRef: React.MutableRefObject<undefined> = React.useRef()

    const handlePrev: (ev: any) => void = (ev: any) => {
        carouselRef?.current?.slidePrev()
    }

    const handleNext: (ev: any) => void = (ev: any) => {
        carouselRef?.current?.slideNext()
    }

    interface RenderPaginationProps {
        activePage: number
        onClick: (ev: any) => void
        pages: Array<any>
    }

    const renderPagination: React.FC<RenderPaginationProps> = ({
        pages,
        activePage,
        onClick,
    }) => (
        <div className={styles.footer}>
            <Button
                buttonStyle='icon'
                size='xl'
                className={styles.prev}
                icon={IconSolid.ChevronLeftIcon}
                disable={carouselRef?.current?.state.activePage === 0}
                onClick={handlePrev}
            />
            {pages.map((page) => {
                const isActivePage: boolean = activePage === page
                return (
                    <CarouselButton
                        key={page}
                        onClick={() => onClick(page)}
                        active={isActivePage}
                    />
                )
            })}
            <Button
                buttonStyle='icon'
                size='xl'
                className={styles.next}
                icon={IconSolid.ChevronRightIcon}
                disable={
                    carouselRef?.current?.state.activePage === length - 1
                }
                onClick={handleNext}
            />
        </div>
    )
    return children.length > 1 ? (
        // @ts-ignore
        <Carousel
            itemsToShow={1}
            showArrows={false}
            isRTL={false}
            ref={carouselRef}
            className={styles.imagesBlock}
            renderPagination={renderPagination}
        >
            {children.map((image, index) => (
                <div
                    key={`md-image-${index}`}
                    className={styles.imageContainer}
                >
                    {image}
                </div>
            ))}
        </Carousel>
    ) : (
        <>
            <div key="md-image-single" className={`${styles.imageBlock}}`}>
                <div className={styles.imageContainer}>{children[0]}</div>
            </div>
        </>
    )
}

export default MarkdownImages
