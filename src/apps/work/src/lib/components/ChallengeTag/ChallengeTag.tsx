import { FC } from 'react'
import classNames from 'classnames'

import { ChallengeType } from '../../models'

import styles from './ChallengeTag.module.scss'

interface ChallengeTagProps {
    type?: string | { id?: string; name?: string; abbreviation?: string }
    challengeTypes?: ChallengeType[]
}

const supportedAbbreviations = new Set([
    'CH',
    'F2F',
    'TSK',
    'MM',
    'RDM',
    'SKL',
    'MA',
    'SRM',
    'PC',
    'TGT',
])

function getTypeName(type?: ChallengeTagProps['type']): string | undefined {
    if (!type) {
        return undefined
    }

    if (typeof type === 'string') {
        return type
    }

    return type.name
}

function getChallengeTypeAbbreviation(
    type: ChallengeTagProps['type'],
    challengeTypes: ChallengeType[] = [],
): string {
    if (!type) {
        return ''
    }

    if (typeof type !== 'string' && type.abbreviation && supportedAbbreviations.has(type.abbreviation)) {
        return type.abbreviation
    }

    const name = typeof type === 'string'
        ? type
        : type.name

    const id = typeof type === 'string'
        ? undefined
        : type.id

    const matchingType = challengeTypes.find(item => (
        item.name === name
        || item.id === id
        || item.abbreviation === name
    ))

    if (!matchingType?.abbreviation || !supportedAbbreviations.has(matchingType.abbreviation)) {
        return ''
    }

    return matchingType.abbreviation
}

export const ChallengeTag: FC<ChallengeTagProps> = (props: ChallengeTagProps) => {
    const abbreviation = getChallengeTypeAbbreviation(props.type, props.challengeTypes)
    const renderedAbbreviation = abbreviation === 'PC'
        ? 'P'
        : (abbreviation || '-')
    const title = getTypeName(props.type) || 'Unknown challenge type'

    return (
        <span className={styles.trackIcon} title={title}>
            <span
                className={classNames(
                    styles.mainIcon,
                    abbreviation ? styles[abbreviation] : styles.unknown,
                )}
            >
                {renderedAbbreviation}
            </span>
        </span>
    )
}

export default ChallengeTag
