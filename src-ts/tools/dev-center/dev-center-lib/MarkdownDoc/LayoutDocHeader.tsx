import * as React from 'react'

import styles from './LayoutDocHeader.module.scss'

interface LayoutDocHeaderProps {
  subtitle?: string
  title?: string
}

export const LayoutDocHeader: React.FC<LayoutDocHeaderProps> = (props) => {
  const { title = '', subtitle = '' }: LayoutDocHeaderProps = props

  return (
    <header>
      <h1 className={styles['title']}>{title}</h1>
      <hr className={styles['divider']} />
      <h2 className={styles['subtitle']}>{subtitle}</h2>
    </header>
  )
}

export default LayoutDocHeader
