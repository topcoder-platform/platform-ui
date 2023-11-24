import {
    Children,
    cloneElement,
    FC,
    isValidElement,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { AccordionItemProps } from './accordion-item'
import styles from './Accordion.module.scss'

interface AccordionProps {
    children: JSX.Element[] | JSX.Element
    defaultOpen?: boolean
}

function computeOpenSectionsState(props: AccordionProps): {[key: string]: boolean} {
    const newOpenState: {[key: string]: boolean} = {}

    Children.forEach<ReactNode>(props.children, child => {
        if (!isValidElement(child)) {
            return
        }

        const childKey = child.key as string
        newOpenState[childKey] = child.props.open ?? props.defaultOpen
    })

    return newOpenState
}

const Accordion: FC<AccordionProps> = props => {
    const prevProps = useRef({ ...props })
    const [openedSections, setOpenedSections] = useState<{[key: string]: boolean}>({})

    const handleToggle = useCallback((key: string) => {
        setOpenedSections(all => ({ ...all, [key]: !all[key] }))
    }, [])

    // check if props have changed and update the openedSections synchronously
    if (prevProps.current.children !== props.children || prevProps.current.defaultOpen !== props.defaultOpen) {
        prevProps.current = { ...props }
        Object.assign(openedSections, computeOpenSectionsState(props))
    }

    // use an effect to make sure the changes are propagated in the state
    useEffect(() => {
        setOpenedSections(computeOpenSectionsState(props))
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
