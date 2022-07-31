import * as React from 'react'

import { useWindowSize } from '../../../../lib'
import { CopyButton } from '../CopyButton'

import styles from './MarkdownCode.module.scss'

interface MarkdownCodeProps {
  children: React.ReactNode,
  code: string,
  lang?: string,
}

export const MarkdownCode: React.FC<MarkdownCodeProps> = (props) => {
  const { children, code, lang }: MarkdownCodeProps = props
  const isTerminal: boolean = (lang === 'terminal' || lang === 'console')
  const [showLineNumbers, setShowLineNumbers]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(!isTerminal)
  // tslint:disable-next-line no-null-keyword
  const ref: React.RefObject<HTMLDivElement> = React.useRef<HTMLDivElement>(null)

  const handleLineNumberVisibilityChange: (visibility: boolean) => void = React.useCallback((visibility: boolean) => {
    if (!isTerminal) {
      setShowLineNumbers(visibility)
    }
  }, [isTerminal])

  return (
    <div className={`${styles['codeBlock']} ${showLineNumbers ? styles['show-line-numbers'] : ''} hljs`} ref={ref}>
      <LineNumbers codeRef={ref} showLineNumbers={showLineNumbers} onVisibilityChange={handleLineNumberVisibilityChange} />
      {children}
      <CopyButton className={styles['copy-btn']} text={code} />
    </div>
  )
}

interface LineNumbersProps {
  codeRef: React.RefObject<HTMLDivElement>,
  onVisibilityChange: (visibility: boolean) => void,
  showLineNumbers: boolean,
}

function LineNumbers(props: LineNumbersProps): React.ReactElement | null {
  const { codeRef, showLineNumbers, onVisibilityChange }: LineNumbersProps = props
  const [lineNumbers, setLineNumbers]: [Array<number>, React.Dispatch<React.SetStateAction<Array<number>>>] = React.useState([1])

  const size: ReturnType<typeof useWindowSize> = useWindowSize()

  // OnResizing
  const debounceTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined> = React.useRef<ReturnType<typeof setTimeout>>()
  React.useEffect(() => {
    if (!size.width || !codeRef.current) {
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = undefined
    }

    const pre: HTMLPreElement | null = codeRef.current.querySelector('pre')
    if (!pre) {
      return
    }
    const innerText: string = pre.innerText
    const clientWidth: number = pre.clientWidth

    const handleResizing: () => void = () => {
      const result: Array<number> = computeLineNumbers(innerText, clientWidth)

      if (result.length < 2) {
        onVisibilityChange(false)
      } else {
        onVisibilityChange(true)
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
  }, [size.width, onVisibilityChange, codeRef.current])

  if (!showLineNumbers) {
    // tslint:disable-next-line no-null-keyword
    return null
  }

  return (
    <div className={styles['lineNumbers']}>
      {lineNumbers.map((n, index) => {
        const prev: number = index > 0 ? lineNumbers[index - 1] : -1
        return <div key={`line-${index}`} className={`${styles['num']} ${prev === n ? styles['hidden'] : ''}`}>{n}</div>
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
  const canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement
  const lines: Array<string> = text.split('\n')
  const result: Array<number> = []

  lines.forEach((line, index) => {
    if (line.length < 10) {
      result.push(index + 1)
    } else {
      const w: number = measureText(line, canvas)
      for (let i: number = 0; i < Math.ceil(w / width); i ++) { result.push(index + 1) }
    }
  })

  result.pop() // EOL character

  return result
}

export default MarkdownCode
