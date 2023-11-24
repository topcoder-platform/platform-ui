import { FC } from 'react'

import { CategoryGroup } from '../../lib'
import { Accordion, AccordionItem } from '../accordion'
import { SkillsList } from '../skills-list'

interface CategoriesAccordionProps {
    categories: CategoryGroup[]
    defaultOpen?: boolean
}

const CategoriesAccordion: FC<CategoriesAccordionProps> = props => (
    <Accordion defaultOpen={props.defaultOpen}>
        {props.categories.map(category => (
            <AccordionItem
                key={category.id}
                label={category.name}
                badgeCount={category.skills.length}
                open={props.defaultOpen}
            >
                {() => (
                    <SkillsList skills={category.skills} key={`cat-${category.id}-list`} />
                )}
            </AccordionItem>
        ))}
    </Accordion>
)

export default CategoriesAccordion
