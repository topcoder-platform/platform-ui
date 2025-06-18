import { FC } from 'react'

import { TableColumn } from '~/libs/ui/lib/components/table'

import { Challenge } from '../../../models'

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

const MobileListView: FC<MobileListViewProps<Challenge>> = props => {
    const renderListItem = (d: Challenge): JSX.Element => {
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
                {/* Track icon */}
                <div>{propertyElements[0]}</div>

                <div className={styles.rows}>
                    <div className={styles.row1}>
                        {/* Title */ propertyElements[1]}
                        {/* Legacy ID */ propertyElements[2]}
                    </div>
                    <div className={styles.row2}>
                        {/* Type & Track */ propertyElements[3]}
                        {/* Current Phase */ propertyElements[4]}
                        {/* Status */ propertyElements[5]}
                    </div>
                    <div className={styles.row3}>
                        {/* Stats */ propertyElements[6]}
                        {/* Actions */ propertyElements[7]}
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
