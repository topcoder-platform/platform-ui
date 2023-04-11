import { FC } from 'react'
import Carousel from 'react-elastic-carousel'

import { CarouselContent } from '../carousel-content.config'
import { DevCenterCarouselItem } from '../DevCenterCarouselItem'

import styles from './DevCenterCarousel.module.scss'
import './carouselStyle.css'

const DevCenterCarousel: FC = () => (
    <div className={styles.container}>
        {/* @ts-ignore */}
        <Carousel
            itemsToShow={1}
            showArrows={false}
            isRTL={false}
        >
            {CarouselContent.map((item, key) => (
                <DevCenterCarouselItem item={item} key={key as any} />
            ))}
        </Carousel>
    </div>
)

export default DevCenterCarousel
