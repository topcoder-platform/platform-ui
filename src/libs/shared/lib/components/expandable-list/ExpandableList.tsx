import React, { FC, PropsWithChildren, useCallback, useState } from 'react'
import classNames from 'classnames'

import { Button, IconSolid } from '~/libs/ui'

import styles from './ExpandableList.module.scss'

interface ExpandableListProps extends PropsWithChildren {
    itemLabel: string
    visible: number
}

const ExpandableList: FC<ExpandableListProps> = props => {
    const listCount = React.Children.count(props.children)
    const [showAll, setShowAll] = useState<boolean>(false)

    const handleClickToggle = useCallback(() => {
        setShowAll(toggle => !toggle)
    }, [])

    const moreLabel = useCallback((count: number) => (
        `${count} more ${props.itemLabel.toLowerCase()}${count > 1 ? 's' : ''}`
    ), [props.itemLabel])

    const renderList = useCallback(() => {
        if (showAll) {
            return props.children
        }

        return React.Children.toArray(props.children)
            .filter((_, i) => i < props.visible)
    }, [showAll, props.visible, props.children])

    const renderToggleBtn = useCallback(() => (
        <div className={classNames(styles.moreBtn, showAll && styles.collapsed)}>
            {showAll ? (
                <Button
                    link
                    icon={IconSolid.ChevronUpIcon}
                    iconToRight
                    label={`Collapse ${props.itemLabel}s`}
                    onClick={handleClickToggle}
                />
            ) : (
                <Button
                    link
                    label={moreLabel(listCount - props.visible)}
                    onClick={handleClickToggle}
                />
            )}
        </div>
    ), [handleClickToggle, listCount, moreLabel, props.itemLabel, props.visible, showAll])

    return (
        <>
            {renderList()}
            {listCount >= props.visible && renderToggleBtn()}
        </>
    )
}

export default ExpandableList
