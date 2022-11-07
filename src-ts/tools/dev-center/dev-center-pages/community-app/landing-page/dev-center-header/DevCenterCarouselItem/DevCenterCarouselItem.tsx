import classNames from 'classnames'
import React, {FC} from 'react'

import { DevCenterTag } from '../../dev-center-tag'
import { CarouselItem } from '../carousel-content.config'

import styles from './DevCenterCarouselItem.module.scss'

const DevCenterCarouselItem: FC<{ item: CarouselItem }> = ({item}) => (
    <div className={styles.card}>
        <div className={styles.titleContainer}>
            {item.isNewFeature && <DevCenterTag text='New Feature'/>}
            <h2 className={styles.headline}>{item.headline}</h2>
            <span className={classNames(styles.summary, 'medium-subtitle')}>{item.summary}</span>
        </div>
        <img src={item.image} className={styles.image} alt=''/>
    </div>
)

export default DevCenterCarouselItem
