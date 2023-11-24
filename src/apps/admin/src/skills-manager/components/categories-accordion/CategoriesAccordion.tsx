import { FC } from 'react'

import { CategoryGroup } from '../../lib'
import { Accordion, AccordionItem } from '../accordion'
import { SkillsList } from '../skills-list'

import styles from './CategoriesAccordion.module.scss'

interface CategoriesAccordionProps {
    categories: CategoryGroup[]
    defaultOpen?: boolean
}

const CategoriesAccordion: FC<CategoriesAccordionProps> = props => {
    const d = 0

    return (
        <Accordion defaultOpen={props.defaultOpen}>
            {props.categories.map(category => (
                <AccordionItem
                    key={category.id}
                    label={category.name}
                    badgeCount={category.skills.length}
                >
                    {() => (
                        <SkillsList skills={category.skills} />
                    )}
                </AccordionItem>
            ))}
        </Accordion>
    )
}

export default CategoriesAccordion
