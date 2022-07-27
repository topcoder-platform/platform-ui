import * as React from 'react'

import { ReactComponent as IconSupport } from '../../assets/i/icon-support.svg'

import styles from './LayoutDocFooter.module.scss'

export const LayoutDocFooter: React.FunctionComponent<{}> = () => {
  return (
    <div className={styles['support']}>
      <IconSupport className={styles['icon']} />
      <div>
        <div className={styles['line1']}>Topcoder Support</div>
        <p className={styles['line2']}>Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
      </div>
    </div>
  )
}

export default LayoutDocFooter
