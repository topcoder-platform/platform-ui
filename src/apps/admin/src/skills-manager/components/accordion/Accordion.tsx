import { Children, cloneElement, FC, isValidElement, ReactNode, useCallback, useEffect, useState } from 'react'

import { AccordionItemProps } from './accordion-item'
import styles from './Accordion.module.scss'

interface AccordionProps {
    children: JSX.Element[] | JSX.Element
    defaultOpen?: boolean
}

const Accordion: FC<AccordionProps> = props => {
    const [openedSections, setOpenedSections] = useState<{[key: string]: boolean}>({})

    const handleToggle = useCallback((key: string) => {
        setOpenedSections(all => ({ ...all, [key]: !all[key] }))
    }, [])

    useEffect(() => {
        const openState: {[key: string]: boolean} = {}

        Children.forEach<ReactNode>(props.children, child => {
            if (!isValidElement(child)) {
                return
            }

            const childKey = child.key as string
            openState[childKey] = child.props.open ?? props.defaultOpen
        })

        setOpenedSections(openState)
    }, [props.defaultOpen, props.children])

    const renderAccordions = (children: JSX.Element[] | JSX.Element): ReactNode => (
        Children.map<ReactNode, ReactNode>(children, child => {
            if (isValidElement(child)) {
                const childKey = child.key as string
                openedSections[childKey] = openedSections[childKey] ?? child.props.open ?? props.defaultOpen

                return cloneElement(
                    child,
                    {
                        open: !!openedSections[childKey],
                        toggle: function toggle() { handleToggle(childKey) },
                    } as AccordionItemProps,
                )
            }

            return child
        })
    )

    return (
        <div className={styles.wrap}>
            {renderAccordions(props.children)}
        </div>
    )
}

export default Accordion
