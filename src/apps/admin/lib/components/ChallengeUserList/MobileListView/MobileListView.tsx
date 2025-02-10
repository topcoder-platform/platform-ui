import { FC, ReactNode } from 'react'
import { TableColumn } from '~/libs/ui/lib/components/table'
import { ChallengeResource } from '../../../models'
import styles from './MobileListView.module.scss'

export interface MobileListViewProps<T> {
  properties: ReadonlyArray<Property<T>>
  data: T[]
  selectAllCheckbox: ReactNode
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

const MobileListView = ({ properties, data, selectAllCheckbox }: MobileListViewProps<ChallengeResource>) => {
  const renderListItem = (d: ChallengeResource) => {
    const propertyElements = properties.map((p) => (
      <PropertyElement propertyName={p.propertyName} renderer={p.renderer} type={p.type} data={d} />
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
          <div className={styles.row3}>{/* Actions */ propertyElements[5]}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <label className={styles.selectAll}>
        {selectAllCheckbox}
        <strong>Select All</strong>
      </label>
      <div className={styles.mobileListView}>{data.map(renderListItem)}</div>
    </>
  )
}

export default MobileListView
