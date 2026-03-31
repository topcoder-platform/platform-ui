/* eslint-disable max-len, newline-per-chained-call, padding-line-between-statements, react/jsx-no-bind, sort-keys, unicorn/no-null */
import { FC, useEffect, useRef, useState } from 'react'

interface CopyButtonProps {
    label: string
    value?: string | null
}

/**
 * Copies a provided value to the clipboard and shows a short inline confirmation.
 */
const CopyButton: FC<CopyButtonProps> = (props: CopyButtonProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const canCopy = typeof props.value === 'string' && props.value.trim().length > 0

    useEffect(() => () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const handleCopy = (): void => {
        if (!canCopy) {
            return
        }

        const textToCopy = props.value ?? ''
        const markCopied = (): void => {
            setIsCopied(true)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                setIsCopied(false)
                timeoutRef.current = null
            }, 1500)
        }

        const clipboard = navigator.clipboard
        if (clipboard?.writeText) {
            clipboard.writeText(textToCopy).then(markCopied).catch(() => {
                // Ignore clipboard errors and fall back to the legacy copy path.
            })
            return
        }

        try {
            const textarea = document.createElement('textarea')
            textarea.value = textToCopy
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            textarea.style.pointerEvents = 'none'
            document.body.append(textarea)
            textarea.focus()
            textarea.select()
            const copied = document.execCommand('copy')
            textarea.remove()
            if (copied) {
                markCopied()
            }
        } catch {
            // Ignore clipboard errors because the action is optional.
        }
    }

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                type='button'
                disabled={!canCopy}
                onClick={handleCopy}
                title={props.label}
                aria-label={props.label}
                style={{
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#0f172a',
                    padding: '4px 6px',
                    borderRadius: 6,
                    cursor: canCopy ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: canCopy ? 1 : 0.6,
                }}
            >
                <svg
                    aria-hidden='true'
                    focusable='false'
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    style={{ display: 'block' }}
                >
                    <path
                        d='M8 3H17L21 7V21H8V3Z'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                    <path
                        d='M3 3H8V21H3V3Z'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </button>
            {isCopied ? (
                <span
                    role='status'
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: 0,
                        transform: 'translateY(-6px)',
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        padding: '4px 6px',
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                    }}
                >
                    Copied
                </span>
            ) : null}
        </div>
    )
}

export default CopyButton
