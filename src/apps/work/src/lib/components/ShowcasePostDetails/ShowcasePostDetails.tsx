import { FC } from 'react'

import { textFormatDateLocaleShortString } from '~/libs/shared/lib/utils/text-format'

import { normalizeSmuValue } from '../../constants/showcase.constants'
import { ShowcaseMetadata } from '../../models/ProjectShowcasePost.model'

import styles from './ShowcasePostDetails.module.scss'

export interface ShowcasePostDetailItem {
    label: string
    value: string
}

export interface ShowcasePostStorySection {
    label: string
    value: string
}

/**
 * Formats a stored YYYY-MM-DD date without shifting it across time zones.
 * @param value Deal close date from the showcase or project metadata.
 * @returns A localized short date, the trimmed input when it is not a calendar date, or undefined when empty.
 * @throws Does not throw.
 */
function formatDealCloseDate(value: string | undefined): string | undefined {
    const trimmed = value?.trim()
    if (!trimmed) {
        return undefined
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(trimmed)

    return Number.isNaN(date.getTime())
        ? trimmed
        : textFormatDateLocaleShortString(date)
}

/**
 * Collects the populated single-value showcase fields in display order.
 * @param data Showcase and shared project metadata.
 * @returns Label/value pairs with blank values removed; SMU uses the custom value for Others.
 * @throws Does not throw.
 */
export function getShowcaseDetailItems(data: ShowcaseMetadata): ShowcasePostDetailItem[] {
    const smu = data.smu === 'Others'
        ? data.smuOther?.trim() || data.smu
        : normalizeSmuValue(data.smu)

    return [
        { label: 'Type', value: data.type },
        { label: 'Customer', value: data.customer },
        { label: 'SMU', value: smu },
        { label: 'Deal Close Date', value: formatDealCloseDate(data.dealCloseDate) },
        { label: 'Key Win', value: data.keyWin },
        { label: 'Current Status', value: data.currentStatus },
        { label: 'Owner', value: data.owner },
    ]
        .map(item => ({ label: item.label, value: item.value?.trim() ?? '' }))
        .filter(item => !!item.value)
}

/**
 * Collects the populated long-form showcase sections in display order.
 * @param data Showcase rich text fields; content is The Solution.
 * @returns Section labels and rich text values with blank sections removed.
 * @throws Does not throw.
 */
export function getShowcaseStorySections(
    data: Pick<ShowcaseMetadata, 'challenge' | 'businessImpact'> & { content?: string },
): ShowcasePostStorySection[] {
    return [
        { label: 'The Challenge', value: data.challenge },
        { label: 'The Solution', value: data.content },
        { label: 'Business Impact Realised', value: data.businessImpact },
    ]
        .filter((item): item is ShowcasePostStorySection => !!item.value?.trim())
}

export interface ShowcasePostDetailsProps {
    data: ShowcaseMetadata
    className?: string
}

/**
 * Shows the populated showcase summary fields shared by the Work preview and the customer showcase.
 * @param props Showcase metadata and an optional wrapper class.
 * @returns A labelled detail grid, or nothing when no summary field is populated.
 * @throws Does not throw.
 */
const ShowcasePostDetails: FC<ShowcasePostDetailsProps> = props => {
    const items = getShowcaseDetailItems(props.data)

    if (!items.length) {
        return <></>
    }

    return (
        <dl className={[styles.details, props.className].filter(Boolean)
            .join(' ')}
        >
            {items.map(item => (
                <div key={item.label} className={styles.item}>
                    <dt className={styles.label}>{item.label}</dt>
                    <dd className={styles.value}>{item.value}</dd>
                </div>
            ))}
        </dl>
    )
}

export default ShowcasePostDetails
