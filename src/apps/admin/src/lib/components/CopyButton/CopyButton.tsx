/**
 * Copy button ui.
 */
import * as React from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { Button, IconOutline, Tooltip } from '~/libs/ui'
import { copyTextToClipboard } from '~/libs/shared'

import styles from './CopyButton.module.scss'

interface CopyButtonProps {
    className?: string
    text?: string
}

export const CopyButton: React.FC<CopyButtonProps> = props => {
    function handleCopyClick(): void {
        copyTextToClipboard(props.text ?? '')
            .then(() => {
                toast.success('Copied', {
                    toastId: 'CopyButton',
                })
            })
    }

    return (
        <Tooltip content='Copy to clipboard'>
            <Button
                size='xl'
                className={classNames(styles['copy-btn'], props.className)}
                icon={IconOutline.DocumentDuplicateIcon}
                onClick={handleCopyClick}
            />
        </Tooltip>
    )
}

export default CopyButton
