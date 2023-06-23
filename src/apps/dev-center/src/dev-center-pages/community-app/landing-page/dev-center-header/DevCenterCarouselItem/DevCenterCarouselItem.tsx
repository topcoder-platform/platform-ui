import React, { FC } from 'react'
import classNames from 'classnames'

import { DevCenterTag } from '../../dev-center-tag'
import { CarouselItem } from '../carousel-content.config'

import styles from './DevCenterCarouselItem.module.scss'

const DevCenterCarouselItem: FC<{ item: CarouselItem }> = props => (
    <div className={styles.card}>
        <div className={styles.titleContainer}>
            {props.item.isNewFeature && <DevCenterTag text='New Feature' />}
            <h2 className={styles.headline}>{props.item.headline}</h2>
            <span className={classNames(styles.summary, 'medium-subtitle')}>
                {props.item.summary}
            </span>
        </div>
        <img src={props.item.image} className={styles.image} alt='' />
    </div>
)

export default DevCenterCarouselItem
