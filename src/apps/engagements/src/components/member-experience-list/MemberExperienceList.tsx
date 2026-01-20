import { FC, useMemo } from 'react'
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { Button, IconOutline, LoadingSpinner } from '~/libs/ui'

import type { MemberExperience } from '../../lib/models'
import { formatDate } from '../../lib/utils'

import styles from './MemberExperienceList.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

interface MemberExperienceListProps {
    experiences: MemberExperience[]
    loading?: boolean
    error?: string
    onRetry?: () => void
    onEdit?: (experience: MemberExperience) => void
    canEdit?: boolean
}

const MemberExperienceList: FC<MemberExperienceListProps> = (props: MemberExperienceListProps) => {
    const experiences = props.experiences
    const loading = props.loading ?? false
    const error = props.error
    const onRetry = props.onRetry
    const onEdit = props.onEdit
    const canEdit = props.canEdit ?? false

    const sortedExperiences = useMemo(() => {
        const parseDate = (value?: string): number => {
            const date = new Date(value ?? '')
            const time = date.getTime()
            return Number.isNaN(time) ? 0 : time
        }

        return [...experiences].sort(
            (a, b) => parseDate(a.createdAt) - parseDate(b.createdAt),
        )
    }, [experiences])

    if (loading) {
        return (
            <div className={styles.loadingState} aria-live='polite'>
                <LoadingSpinner className={styles.loadingSpinner} inline />
                <span>Loading experiences...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.errorState} role='alert'>
                <IconOutline.ExclamationIcon className={styles.errorIcon} />
                <div>
                    <p className={styles.errorText}>{error}</p>
                    {onRetry && (
                        <Button label='Retry' onClick={onRetry} primary />
                    )}
                </div>
            </div>
        )
    }

    if (sortedExperiences.length === 0) {
        return (
            <div className={styles.emptyState} aria-live='polite'>
                <IconOutline.ChatAltIcon className={styles.emptyIcon} />
                <div>No member experiences yet</div>
            </div>
        )
    }

    return (
        <div className={styles.experienceList}>
            {sortedExperiences.map(experience => {
                const memberLabel = experience.memberHandle
                    ? `@${experience.memberHandle}`
                    : experience.memberId
                        ? `Member ${experience.memberId}`
                        : 'Member'
                const handleEditClick = function (): void {
                    onEdit?.(experience)
                }

                return (
                    <div key={experience.id} className={styles.experienceItem}>
                        <div className={styles.experienceHeader}>
                            <div className={styles.experienceMeta}>
                                <span className={styles.memberLabel}>{memberLabel}</span>
                                <span className={styles.experienceDate}>
                                    {formatDate(experience.createdAt)}
                                </span>
                            </div>
                            {canEdit && onEdit && (
                                <Button
                                    label='Edit'
                                    onClick={handleEditClick}
                                    secondary
                                />
                            )}
                        </div>
                        <div className={styles.experienceContent}>
                            <Markdown
                                remarkPlugins={[
                                    remarkFrontmatter,
                                    [remarkGfm, { singleTilde: false }],
                                    remarkBreaks,
                                ]}
                            >
                                {experience.experienceText}
                            </Markdown>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default MemberExperienceList
