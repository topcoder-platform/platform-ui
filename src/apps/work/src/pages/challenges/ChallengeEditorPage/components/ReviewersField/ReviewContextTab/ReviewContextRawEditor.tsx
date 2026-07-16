import { FC, useMemo, useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/base16/tomorrow-night.css'

import { Button } from '~/libs/ui'
import { copyTextToClipboard } from '~/libs/shared'
import { showErrorToast, showSuccessToast } from '~/apps/work/src/lib'
import { ChallengeReviewContextData } from '~/apps/work/src/lib/models'

import styles from './ReviewContextRawEditor.module.scss'
import { pick } from 'lodash'

interface ReviewContextRawEditorProps {
    context: ChallengeReviewContextData
}

const ReviewContextRawEditor: FC<ReviewContextRawEditorProps> = ({ context }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const jsonText = useMemo(() => JSON.stringify(pick(context, ['challengeId', 'requirements']), null, 2), [context])

    const highlightedJson = useMemo(() => (
        hljs.highlightAuto(jsonText, ['json']).value
    ), [jsonText])

    const toggleExpanded = (): void => {
        setIsExpanded(prev => !prev)
    }

    const handleCopyJson = async (): Promise<void> => {
        try {
            await copyTextToClipboard(jsonText)
            showSuccessToast('Raw context JSON copied to clipboard.')
        } catch {
            showErrorToast('Failed to copy raw context JSON.')
        }
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <button
                    type='button'
                    aria-expanded={isExpanded}
                    className={styles.toggle}
                    onClick={toggleExpanded}
                >
                    <span className={styles.toggleIcon}>
                        {isExpanded ? '▼' : '▶'}
                    </span>
                    Raw Context JSON
                </button>
                <Button
                    label='Copy 📋'
                    onClick={handleCopyJson}
                    secondary
                    size='sm'
                />
            </div>
            {isExpanded && (
                <div className={styles.content}>
                    <pre
                        className={`${styles.json} hljs`}
                        dangerouslySetInnerHTML={{ __html: highlightedJson }}
                    />
                </div>
            )}
        </div>
    )
}

export default ReviewContextRawEditor
