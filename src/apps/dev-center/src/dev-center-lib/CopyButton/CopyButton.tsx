import * as React from 'react'

import { Button, copyTextToClipboard, IconOutline } from '~/libs/ui'

import styles from './CopyButton.module.scss'

interface CopyButtonProps {
    className?: string
    text?: string
}

export const CopyButton: React.FC<CopyButtonProps> = props => {
    const { text = '', className = '' }: CopyButtonProps = props

    return (
        <Button
            size='xl'
            buttonStyle='icon'
            className={`${styles['copy-btn']} ${className}`}
            icon={IconOutline.DocumentDuplicateIcon}
            onClick={() => copyTextToClipboard(text)}
        />
    )
}

export default CopyButton
