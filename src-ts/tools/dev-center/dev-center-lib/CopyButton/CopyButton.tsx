import * as React from 'react'

import { Button, IconOutline } from '../../../../lib'
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
            icon={IconOutline.DocumentDuplicateIcon}
            onClick={() => copy(text)}
        />
    )
}

export default CopyButton
