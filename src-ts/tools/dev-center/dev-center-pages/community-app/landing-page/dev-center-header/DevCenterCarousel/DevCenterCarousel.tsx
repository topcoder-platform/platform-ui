import { FC } from 'react'
import Carousel from 'react-elastic-carousel'

import { CarouselContent } from '../carousel-content.config'
import { DevCenterCarouselItem } from '../DevCenterCarouselItem'

import './carouselStyle.css'
import styles from './DevCenterCarousel.module.scss'

const DevCenterCarousel: FC = () => (
    <div className={styles.container}>
        <Carousel
            itemsToShow={1}
            showArrows={false}
            isRTL={false}
        >
            {CarouselContent.map((item, key) => <DevCenterCarouselItem item={item} key={key} />)}
        </Carousel>
    </div>
)

export default DevCenterCarousel
