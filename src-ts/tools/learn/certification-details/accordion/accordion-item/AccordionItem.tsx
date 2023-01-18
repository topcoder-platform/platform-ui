import { FC } from 'react'
import classNames from 'classnames'

import { type FaqEntry } from '../Accordion'
import { IconSolid } from '../../../../../lib'

import styles from './AccordionItem.module.scss'

interface AccordionItemProps {
    item: FaqEntry
    toggle: (item: FaqEntry) => void
    isToggled: boolean
}

const AccordionItem: FC<AccordionItemProps> = (props: AccordionItemProps) => {
    function toggle(): void {
        props.toggle(props.item)
    }

    return (
        <div
            className={
                classNames(
                    styles.item,
                    props.isToggled && 'toggled',
                )
            }
            key={props.item.title}
        >
            <div
                className={classNames('body-main-bold', styles.itemTitle)}
                onClick={toggle}
            >
                {props.item.title}
                <span className={styles.itemArrowIcon}>
                    <IconSolid.ChevronUpIcon />
                </span>
            </div>
            <div
                className={classNames('body-main', styles.itemDesc)}
                dangerouslySetInnerHTML={{ __html: props.item.description }}
            />
        </div>
    )
}

export default AccordionItem
