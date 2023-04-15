import * as React from 'react'
import classNames from 'classnames'

import { copyTextToClipboard, IconOutline, UiButton } from '~/libs/ui'

import styles from './CopyButton.module.scss'

interface CopyButtonProps {
    className?: string
    text?: string
}

export const CopyButton: React.FC<CopyButtonProps> = props => {
    function handleCopyClick(): void {
        copyTextToClipboard(props.text ?? '')
    }

    return (
        <UiButton
            size='xl'
            className={classNames(styles['copy-btn'], props.className)}
            icon={IconOutline.DocumentDuplicateIcon}
            onClick={handleCopyClick}
        />
    )
}

export default CopyButton
