import { FC } from 'react'

import { IconWrapper, textFormatMoneyLocaleString } from '~/libs/ui'

import styles from './WorkServicePrice.module.scss'
import { HelpIcon } from '../help-icon'
import classNames from 'classnames'

export interface WorkServicePriceProps {
  duration: number,
  hideTitle?: boolean
  icon?: JSX.Element,
  iconClass?: string,
  price: number,
  serviceType: string,
  showIcon?: boolean,
  stickerPrice?: number
}

const ServicePrice: FC<WorkServicePriceProps> = (props: WorkServicePriceProps) => (
    <div className={styles.container}>
        <div className={styles.inline}>
            {!!props.showIcon && !!props.icon && (
                <IconWrapper icon={props.icon} className={classNames(props.iconClass, styles.icon)} />
            )}
            <div className={styles['content-wrapper']}>
                <div>
                    {!props.hideTitle && (
                        <p>
                            <h3 className={styles.serviceTitle}>
                                {props.serviceType}
                            </h3>
                        </p>
                    )}
                    <h3>
                        <div className={styles.priceAndDuration}>
                            {props.stickerPrice && (
                                <span className={styles.stickerPrice}>
                                    {textFormatMoneyLocaleString(props.stickerPrice)}
                                </span>
                            )}
                            <span className={styles.discount}>{textFormatMoneyLocaleString(props.price)}</span>
                            <span className={styles.separator}>|</span>
                            <span className={styles.days}>
                                {props.duration}
    &nbsp;Days
                            </span>
                            <span className={styles.help}>
                                <HelpIcon>
                                    The price and project length is dynamic and dependent on the
                                    variables selected as you define your work.
                                </HelpIcon>
                            </span>
                        </div>
                    </h3>
                </div>
            </div>
        </div>
    </div>
)

export default ServicePrice
