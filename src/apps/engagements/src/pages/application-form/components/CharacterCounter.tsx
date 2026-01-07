import { FC } from 'react'
import classNames from 'classnames'

import styles from '../ApplicationFormPage.module.scss'

interface CharacterCounterProps {
    currentLength: number
    maxLength: number
}

const CharacterCounter: FC<CharacterCounterProps> = ({ currentLength, maxLength }) => {
    const ratio = maxLength > 0 ? currentLength / maxLength : 0
    const isWarning = ratio >= 0.9 && ratio < 1
    const isLimit = ratio >= 1

    return (
        <div
            className={classNames(
                styles.characterCounter,
                isWarning && styles.characterCounterWarning,
                isLimit && styles.characterCounterLimit,
            )}
        >
            {currentLength} / {maxLength} characters
        </div>
    )
}

export default CharacterCounter
