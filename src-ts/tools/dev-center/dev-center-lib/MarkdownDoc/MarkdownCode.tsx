import { identity } from 'lodash'
import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    RefObject,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { useWindowSize } from '../../../../lib'
import { CopyButton } from '../CopyButton'

import styles from './MarkdownCode.module.scss'

interface LineNumbersProps {
    codeRef: RefObject<HTMLDivElement>
    onVisibilityChange: (visibility: boolean) => void
    showLineNumbers: boolean
}

const LineNumbers: FC<LineNumbersProps> = props => {

    const [lineNumbers, setLineNumbers]: [
        Array<number>,
        Dispatch<SetStateAction<Array<number>>>
    ] = useState([1])

    const size: ReturnType<typeof useWindowSize> = useWindowSize()

    // OnResizing
    const debounceTimer: MutableRefObject<
        ReturnType<typeof setTimeout> | undefined
    > = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        if (!size.width || !props.codeRef.current) {
            return undefined
        }

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
            debounceTimer.current = undefined
        }

        const pre: HTMLPreElement | null = props.codeRef.current.querySelector('pre')
        if (!pre) {
            return undefined
        }

        const innerText: string = pre.innerText
        const clientWidth: number = pre.clientWidth

        const handleResizing: () => void = () => {
            const result: Array<number> = computeLineNumbers(
                innerText,
                clientWidth,
            )

            if (result.length < 2) {
                props.onVisibilityChange.call(undefined, false)
            } else {
                props.onVisibilityChange.call(undefined, true)
            }

            setLineNumbers(result)
        }

        debounceTimer.current = setTimeout(() => {
            debounceTimer.current = undefined
            handleResizing()
        }, 100)

        return () => {
            clearTimeout(debounceTimer.current)
        }
    }, [size.width, props.onVisibilityChange, props.codeRef])

    if (!props.showLineNumbers) {
        return <></>
    }

    return (
        <div className={styles.lineNumbers}>
            {lineNumbers.map((n, index) => {
                const prev: number = index > 0 ? lineNumbers[index - 1] : -1
                return (
                    <div
                        key={identity(`line-${index}`)}
                        className={`${styles.num} ${prev === n ? styles.hidden : ''
                        }`}
                    >
                        {n}
                    </div>
                )
            })}
        </div>
    )
}

function measureText(text: string, canvas: HTMLCanvasElement): number {
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
    if (!context) {
        return Number.MAX_SAFE_INTEGER
    }

    context.font = 'normal 400 14px / 18px "Roboto Mono"'
    const metrics: TextMetrics = context.measureText(text)
    return metrics.width
}

function computeLineNumbers(text: string, width: number): Array<number> {
    const canvas: HTMLCanvasElement = document.createElement(
        'canvas',
    ) as HTMLCanvasElement
    const lines: Array<string> = text.split('\n')
    const result: Array<number> = []

    lines.forEach((line, index) => {
        if (line.length < 10) {
            result.push(index + 1)
        } else {
            const w: number = measureText(line, canvas)
            for (let i: number = 0; i < Math.ceil(w / width); i++) {
                result.push(index + 1)
            }
        }
    })

    result.pop() // EOL character

    return result
}

interface MarkdownCodeProps {
    children: ReactNode
    code: string
    lang?: string
}

export const MarkdownCode: FC<MarkdownCodeProps> = props => {
    const isTerminal: boolean = props.lang === 'terminal' || props.lang === 'console'
    const [showLineNumbers, setShowLineNumbers]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState(!isTerminal)
    const ref: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)

    const handleLineNumberVisibilityChange: (visibility: boolean) => void
        = useCallback(
            (visibility: boolean) => {
                if (!isTerminal) {
                    setShowLineNumbers(visibility)
                }
            },
            [isTerminal],
        )

    return (
        <div
            className={`${styles.codeBlock} ${showLineNumbers ? styles['show-line-numbers'] : ''} hljs`}
            ref={ref}
        >
            <LineNumbers
                codeRef={ref}
                showLineNumbers={showLineNumbers}
                onVisibilityChange={handleLineNumberVisibilityChange}
            />
            {props.children}
            <CopyButton className={styles['copy-btn']} text={props.code} />
        </div>
    )
}

export default MarkdownCode
