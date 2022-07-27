import * as React from 'react'

import { useWindowSize } from '../../../../lib/hooks/use-window-size.hook'

import styles from './MarkdownAccordion.module.scss'

export interface MarkdownAccordionProps {
  children: React.ReactNode
}

// ref: src-ts/lib/styles/variables/_breakpoints.scss
const LG_MAX: number = 984

export const MarkdownAccordion: React.FunctionComponent<MarkdownAccordionProps> = (props) => {
  const { children: childrenProp }: MarkdownAccordionProps = props

  const [collapsed, setCollapsed]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false)
  const size: ReturnType<typeof useWindowSize> = useWindowSize()

  if (size && size.width > LG_MAX) {
    return (
      <>
        {childrenProp}
      </>
    )
  }

  const [h2, ...children]: ReturnType<typeof React.Children.toArray> = React.Children.toArray(childrenProp)
  const header: React.ReactNode = React.isValidElement(h2)
    ? React.cloneElement(h2, { onClick: () => setCollapsed(!collapsed) })
    : h2

  return (
    <div className={`${styles['accordion']} ${collapsed ? styles['collapsed'] : ''}`}>
      {header}
      {children}
    </div>
  )
}

export default MarkdownAccordion
