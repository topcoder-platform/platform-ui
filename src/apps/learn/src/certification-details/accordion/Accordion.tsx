import { Dispatch, FC, SetStateAction, useState } from 'react'

import { AccordionItem } from './accordion-item'
import styles from './Accordion.module.scss'

export interface FaqEntry {
    title: string
    description: string
}

interface AccordionProps {
    items: Array<FaqEntry>
}

type ToggledItems = {
    [key: string]: boolean
}

const Accordion: FC<AccordionProps> = (props: AccordionProps) => {

    const [toggled, setToggled]: [ToggledItems, Dispatch<SetStateAction<ToggledItems>>] = useState({} as ToggledItems)

    function toggle(item: FaqEntry): void {
        setToggled(t => ({ ...t, [item.title]: !t[item.title] }))
    }

    return (
        <div className={styles.wrap}>
            {props.items.map((item: FaqEntry) => (
                <AccordionItem
                    item={item}
                    toggle={toggle}
                    isToggled={!!toggled[item.title]}
                    key={item.title}
                />
            ))}
        </div>
    )
}

export default Accordion
