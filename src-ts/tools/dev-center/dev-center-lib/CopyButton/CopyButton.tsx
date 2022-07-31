import * as React from 'react'

import { Button } from '../../../../lib'
import { ReactComponent as IconCopy } from '../../assets/i/icon-copy.svg'
import copy from '../functions/copy-to-clipboard'

import styles from './CopyButton.module.scss'

interface CopyButtonProps {
    className?: string
    text?: string
}

export const CopyButton: React.FC<CopyButtonProps> = (props) => {
    const { text = '', className = '' }: CopyButtonProps = props

    return (
        <Button
            size='xl'
            buttonStyle='icon'
            className={`${styles['copy-btn']} ${className}`}
            icon={IconCopy}
            onClick={() => copy(text)}
        />
    )
}

export default CopyButton
