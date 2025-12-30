import { FC, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import styles from './CopyButton.module.scss'

type Props = {
    value?: string
    label: string
    className?: string
}

export const CopyButton: FC<Props> = (props: Props) => {
    const [isCopied, setIsCopied] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const canCopy = typeof props.value === 'string' && props.value.trim().length > 0

    useEffect(() => () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = undefined
        }
    }, [])

    const markCopied = (): void => {
        setIsCopied(true)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            setIsCopied(false)
            timeoutRef.current = undefined
        }, 1500)
    }

    function copyToClipboard(): void {
        if (!canCopy) {
            return
        }

        const textToCopy = props.value ?? ''
        const clipboard = navigator.clipboard

        if (clipboard?.writeText) {
            clipboard
                .writeText(textToCopy)
                .then(markCopied)
                .catch(() => undefined)
            return
        }

        try {
            const textarea = document.createElement('textarea')
            textarea.value = textToCopy
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            textarea.style.pointerEvents = 'none'
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            const copied = document.execCommand('copy')
            document.body.removeChild(textarea)
            if (copied) {
                markCopied()
            }
        } catch {
            // Ignore clipboard errors.
        }
    }

    return (
        <button
            type='button'
            className={classNames('borderButton', styles.button, props.className, {
                [styles.copied]: isCopied,
            })}
            onClick={copyToClipboard}
            disabled={!canCopy}
            aria-label={props.label}
            title={props.label}
        >
            {isCopied ? (
                <svg
                    aria-hidden='true'
                    focusable='false'
                    viewBox='0 0 16 16'
                    className={styles.icon}
                >
                    <path
                        d='M13.5 4.5L6.5 11.5L2.5 7.5'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            ) : (
                <svg
                    aria-hidden='true'
                    focusable='false'
                    viewBox='0 0 24 24'
                    className={styles.icon}
                >
                    <path
                        d='M8 3H17L21 7V21H8V3Z'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                    <path
                        d='M3 3H8V21H3V3Z'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            )}
            <span className={styles.srOnly}>{props.label}</span>
        </button>
    )
}

export default CopyButton
