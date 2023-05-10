import { FC } from 'react'
import classNames from 'classnames'

import { IconWrapper } from '~/libs/ui'
import { textFormatMoneyLocaleString } from '~/libs/shared'

import { HelpIcon } from '../help-icon'

import styles from './WorkServicePrice.module.scss'

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

const WorkServicePrice: FC<WorkServicePriceProps> = (props: WorkServicePriceProps) => (
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
                                <HelpIcon inverted>
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

export default WorkServicePrice
