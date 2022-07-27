import * as React from 'react'
import Carousel from 'react-elastic-carousel'

import { currencyFormat } from '../../../../../src/utils'
import { ReactComponent as IconPrev } from '../../assets/i/icon-cheveron-left.svg'
import { ReactComponent as IconNext } from '../../assets/i/icon-cheveron-right.svg'

import './MarkdownImages.css'
import styles from './MarkdownImages.module.scss'

export interface MarkdownImagesProps {
  children: Array<React.ReactNode>,
  length: number,
}

const NIL: () => void = () => {}

interface CarouselButtonProps {
  active: boolean
  onClick: (ev: any) => void
}

const CarouselButton: React.FC<CarouselButtonProps> = ({onClick, active}) => {
  return (
    <button
      className={`${styles['indicator']} ${active ? styles['active'] : ''}`}
      onClick={onClick}
    >
    </button>
  )
}

const MarkdownImages: React.FC<MarkdownImagesProps> = ({children, length}) => {
  // tslint:disable-next-line typedef
  const carouselRef = React.useRef()

  const handlePrev: (ev: any) => void = (ev: any) => {
    carouselRef?.current?.slidePrev()
  }

  const handleNext: (ev: any) => void = (ev: any) => {
    carouselRef?.current?.slideNext()
  }

  interface RenderPaginationProps {activePage: number, onClick: (ev: any) => void, pages: Array<any>, }

  const renderPagination: React.FC<RenderPaginationProps> = ({ pages, activePage, onClick }) => {
    return (
      <div className={styles['footer']}>
        <button
          onClick={handlePrev}
          className={styles['prev']}
          disabled={carouselRef?.current?.state.activePage === 0}
        ><IconPrev/></button>
        {pages.map(page => {
          const isActivePage: boolean = activePage === page
          return (
            <CarouselButton
              key={page}
              onClick={() => onClick(page)}
              active={isActivePage}
            />
          )
        })}
        <button
          onClick={handleNext}
          className={styles['next']}
          disabled={carouselRef?.current?.state.activePage === length - 1}
        ><IconNext/></button>
      </div>
    )
  }
  return(
    <Carousel
        itemsToShow={1}
        showArrows={false}
        isRTL={false}
        ref={carouselRef}
        className={styles['imagesBlock']}
        renderPagination = {renderPagination}
        >
        {children.map(image => (
          <div className={styles['imageContainer']}>
            {image}
          </div>
        ))}
    </Carousel>
  )
}

export default MarkdownImages
