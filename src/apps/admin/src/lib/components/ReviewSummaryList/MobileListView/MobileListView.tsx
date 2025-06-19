import { FC } from 'react'

import { TableColumn } from '~/libs/ui/lib/components/table'

import { ReviewSummary } from '../../../models'

import styles from './MobileListView.module.scss'

type Property<T> = TableColumn<T>

export interface MobileListViewProps<T> {
    properties: ReadonlyArray<Property<T>>
    data: T[]
}

const PropertyElement = <T, >(props: Property<T> & { data: T }): JSX.Element => {
    let item: JSX.Element | undefined
    switch (props.type) {
        case 'element': {
            item = props.renderer?.(props.data)
            break
        }

        case 'action': {
            item = props.renderer?.(props.data)
            break
        }

        case 'text':
        case 'number': {
            item = (
                <>
                    {props.propertyName
                        ? (props.data as { [K: string]: unknown })[
                            props.propertyName
                        ]
                        : undefined}
                </>
            )
            break
        }

        default: {
            item = undefined
        }
    }

    return <div className={styles.propertyElement}>{item}</div>
}

const MobileListView: FC<MobileListViewProps<ReviewSummary>> = props => {
    const renderListItem = (d: ReviewSummary): JSX.Element => {
        const propertyElements = props.properties.map(p => (
            <PropertyElement
                propertyName={p.propertyName}
                renderer={p.renderer}
                type={p.type}
                data={d}
            />
        ))

        const propertyElementLabels = props.properties.map(p => (
            <div className={styles.propertyElementLabel}>{`${p.label}`}</div>
        ))

        return (
            <div className={styles.mobileListViewItemContainer} key={d.legacyChallengeId}>
                <div className={styles.rows}>
                    <div className={styles.row1}>
                        {/* Title */ propertyElements[0]}
                        {/* Status */ propertyElements[2]}
                    </div>
                    <div className={styles.row2}>
                        {/* Legacy ID */ propertyElements[1]}
                    </div>
                    <div className={styles.row3}>
                        {/* propertyElementLabels[5] */}
                        {/* Open Review Opp' */ propertyElements[3]}
                    </div>
                    <div className={styles.row4}>
                        {propertyElementLabels[4]}
                        {/* Review Applications */ propertyElements[4]}
                    </div>
                    <div className={styles.row5}>
                        {/* Action */ propertyElements[5]}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.mobileListView}>
            {props.data.map(renderListItem)}
        </div>
    )
}

export default MobileListView
