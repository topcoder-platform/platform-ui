import { FC } from 'react'

import { IconOutline, textFormatMoneyLocaleString } from '../../../lib/index'
import { Tooltip } from '../../../lib/tooltip'

import styles from './WorkServicePrice.module.scss'

export interface WorkServicePriceProps {
  duration: number,
  hideTitle?: boolean
  icon?: JSX.Element,
  price: number,
  serviceType: string,
  showIcon?: boolean,
  stickerPrice?: number
}

const ServicePrice: FC<WorkServicePriceProps> = (props: WorkServicePriceProps) => {
  const { icon, showIcon, hideTitle = false, serviceType, stickerPrice, price = 0, duration }: WorkServicePriceProps = props

  return (
    <div className={styles.container}>
      <div className={styles.inline}>
        <div className={styles.iconWrapper}>
          {!!showIcon && !!icon && (
            <>{icon}</>
          )}
        </div>
        <div>
          {!hideTitle && (
            <p><h3 className={styles.serviceTitle}>
              {serviceType}
            </h3></p>
          )}
          <h3>
            <div className={styles.priceAndDuration}>
              {stickerPrice && (
                <span className={styles.stickerPrice}>
                  {textFormatMoneyLocaleString(stickerPrice)}
                </span>
              )}
              <span className={styles.discount}>{textFormatMoneyLocaleString(price)}</span>
              <span className={styles.separator}>|</span>
              <span className={styles.days}>{duration}&nbsp;Days</span>
              <span className={styles.help}>
                <Tooltip
                  content='The price and project length is dynamic and dependent on the
                  variables selected as you define your work.'
                  triggerOn='hover'
                  trigger={(
                    <IconOutline.QuestionMarkCircleIcon width={14} height={14} />
                  )}
                />
              </span>
            </div>
          </h3>
        </div>
      </div>
    </div>
  )
}

export default ServicePrice
