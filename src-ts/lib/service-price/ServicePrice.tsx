import { FC } from 'react'

import { currencyFormat } from '../../utils'
import HelpIcon from '../help-icon/HelpIcon'

import styles from './styles.module.scss'

export interface ServicePriceProps {
  duration: number,
  hideTitle?: boolean
  icon?: JSX.Element,
  price: number,
  serviceType: string,
  showIcon?: boolean,
  stickerPrice: number
}

const ServicePrice: FC<ServicePriceProps> = (props: ServicePriceProps) => {
  const { icon, showIcon, hideTitle, serviceType, stickerPrice, price, duration }: ServicePriceProps = props

  return (
    <div className={styles['container']}>
      <div className={styles['inline']}>
        <div className={styles['iconWrapper']}>{showIcon && icon && <>{icon}</>}</div>
        <div>
          {!hideTitle && <p className={styles['serviceTitle']}>{serviceType}</p>}
          <div className={styles['priceAndDuration']}>
            {stickerPrice && (
              <span className={styles['stickerPrice']}>
                {currencyFormat(stickerPrice)}
              </span>
            )}
            <span className={styles['discount']}>{currencyFormat(price)}</span>
            <span className={styles['separator']} />
            <span className={styles['days']}>{duration}&nbsp;Days</span>
            <div className={styles['filler']} />
            <HelpIcon>
              The price and project length is dynamic and dependent on the
              variables selected as you define your work.
            </HelpIcon>
          </div>
        </div>
      </div>
    </div>
  )
}

ServicePrice.defaultProps = {
  hideTitle: false,
  price: 0,
}

export default ServicePrice
