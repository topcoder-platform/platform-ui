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
    const [copied, setCopied] = React.useState<boolean>(false)

    function handleCopyClick(): void {
        copyTextToClipboard(props.text ?? '')
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1200)
                toast.success('Copied to clipboard', {
                    toastId: 'CopyButton',
                })
            })
    }

    return (
        <Tooltip
            content={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
            triggerOn='click-hover'
        >
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
