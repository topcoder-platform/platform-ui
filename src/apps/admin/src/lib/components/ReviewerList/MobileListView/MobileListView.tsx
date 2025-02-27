import { FC } from 'react'

import { TableColumn } from '~/libs/ui/lib/components/table'

import { Reviewer } from '../../../models'

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

const MobileListView: FC<MobileListViewProps<Reviewer>> = props => {
    const renderListItem = (d: Reviewer): JSX.Element => {
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
            <div className={styles.mobileListViewItemContainer} key={d.userId}>
                <div className={styles.rows}>
                    <div className={styles.row1}>
                        {/* Handle */ propertyElements[0]}
                    </div>
                    <div className={styles.row2}>
                        {/* Email */ propertyElements[1]}
                    </div>
                    <div className={styles.row3}>
                        {/* Status */ propertyElements[2]}
                        {/* Received Date */ propertyElements[3]}
                    </div>
                    <div className={styles.row4}>
                        {propertyElementLabels[4]}
                        {/* Open Review Opp' */ propertyElements[4]}
                    </div>
                    <div className={styles.row5}>
                        {propertyElementLabels[5]}
                        {/* Latest Completed Reviews' */ propertyElements[5]}
                    </div>
                    <div className={styles.row6}>
                        {/* Actions */ propertyElements[7]}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={styles.mobileListView}>
                {props.data.map(renderListItem)}
            </div>
        </>
    )
}

export default MobileListView
