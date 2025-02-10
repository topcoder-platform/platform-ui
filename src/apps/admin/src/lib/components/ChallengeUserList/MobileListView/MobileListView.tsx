import { FC, ReactNode } from 'react'

import { TableColumn } from '~/libs/ui/lib/components/table'

import { ChallengeResource } from '../../../models'

import styles from './MobileListView.module.scss'

type Property<T> = TableColumn<T>

export interface MobileListViewProps<T> {
    properties: ReadonlyArray<Property<T>>
    data: T[]
    selectAllCheckbox: ReactNode
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

        case 'text': {
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

const MobileListView: FC<MobileListViewProps<ChallengeResource>> = props => {
    const renderListItem = (d: ChallengeResource): JSX.Element => {
        const propertyElements = props.properties.map(p => (
            <PropertyElement
                propertyName={p.propertyName}
                renderer={p.renderer}
                type={p.type}
                data={d}
            />
        ))
        return (
            <div className={styles.mobileListViewItemContainer} key={d.id}>
                {/* Checkbox */}
                <div>{propertyElements[0]}</div>

                <div className={styles.rows}>
                    <div className={styles.row1}>
                        {/* Handle */ propertyElements[1]}
                        {/* Role */ propertyElements[2]}
                    </div>
                    <div className={styles.row2}>
                        {/* Email */ propertyElements[3]}
                        {/* Registered */ propertyElements[4]}
                    </div>
                    <div className={styles.row3}>
                        {/* Actions */ propertyElements[5]}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <label className={styles.selectAll}>
                {props.selectAllCheckbox}
                <strong>Select All</strong>
            </label>
            <div className={styles.mobileListView}>
                {props.data.map(renderListItem)}
            </div>
        </>
    )
}

export default MobileListView
