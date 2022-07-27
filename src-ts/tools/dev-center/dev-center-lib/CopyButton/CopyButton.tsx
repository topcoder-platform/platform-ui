import * as React from 'react'

import { ReactComponent as IconCopy } from '../../assets/i/icon-copy.svg'
import copy from '../functions/copy-to-clipboard'

import styles from './CopyButton.module.scss'

export interface CopyButtonProps {
  className?: string
  text?: string
}

export const CopyButton: React.FunctionComponent<CopyButtonProps> = (props) => {
  const { text = '', className = '' }: CopyButtonProps = props

  return (
    <button
      className={`${styles['copy-btn']} ${className}`}
      onClick={() => copy(text)}
    >
      <IconCopy />
    </button>
  )
}

export default CopyButton
