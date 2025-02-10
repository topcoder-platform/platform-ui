import { FC, ReactNode } from 'react'
import { TableColumn } from '~/libs/ui/lib/components/table'
import { Challenge } from '../../../models'
import styles from './MobileListView.module.scss'

export interface MobileListViewProps<T> {
  properties: ReadonlyArray<Property<T>>
  data: T[]
}

interface Property<T> extends TableColumn<T> {}

const PropertyElement = <T,>({ propertyName, renderer, type, data }: Property<T> & { data: T }) => {
  let item: JSX.Element | undefined
  switch (type) {
    case 'element': {
      item = renderer?.(data)
      break
    }
    case 'action': {
      item = renderer?.(data)
      break
    }
    case 'text': {
      item = <>{propertyName ? (data as { [K: string]: unknown })[propertyName] : null}</>
      break
    }
  }
  return <div className={styles.propertyElement}>{item}</div>
}

const MobileListView = ({ properties, data }: MobileListViewProps<Challenge>) => {
  const renderListItem = (d: Challenge) => {
    const propertyElements = properties.map((p) => (
      <PropertyElement propertyName={p.propertyName} renderer={p.renderer} type={p.type} data={d} />
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

  return <div className={styles.mobileListView}>{data.map(renderListItem)}</div>
}

export default MobileListView
