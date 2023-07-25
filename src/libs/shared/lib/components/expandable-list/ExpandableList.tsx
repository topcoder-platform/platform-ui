import React, { FC, PropsWithChildren, useCallback, useState } from 'react'

import { Button } from '~/libs/ui'

interface ExpandableListProps extends PropsWithChildren {
    visible: number
}

const ExpandableList: FC<ExpandableListProps> = props => {
    const listCount = React.Children.count(props.children)
    const [showAll, setShowAll] = useState<boolean>(false)

    const handleClickExpand = useCallback(() => {
        setShowAll(true)
    }, [])

    const renderList = useCallback(() => {
        if (showAll) {
            return props.children
        }

        return React.Children.toArray(props.children)
            .filter((_, i) => i < props.visible)
    }, [showAll, props.visible, props.children])

    return (
        <>
            {renderList()}
            {!showAll && listCount >= props.visible && (
                <Button
                    secondary
                    label={`+ ${listCount - props.visible}`}
                    onClick={handleClickExpand}
                />
            )}
        </>
    )
}

export default ExpandableList
