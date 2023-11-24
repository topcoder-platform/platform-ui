import { FC } from 'react'

import { CategoryGroup } from '../../lib'
import { Accordion, AccordionItem } from '../accordion'
import { SkillsList } from '../skills-list'
import { AccordionMenuItem } from '../accordion/accordion-menu'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../skills-manager.context'

interface CategoriesAccordionProps {
    categories: CategoryGroup[]
    defaultOpen?: boolean
}

const groupActions: AccordionMenuItem[] = [
    { action: 'edit:category', label: 'Edit Category' },
    { action: 'edit:skills:bulk', label: 'Bulk Edit Skills' },
]

const CategoriesAccordion: FC<CategoriesAccordionProps> = props => {
    const {
        setEditCategory,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    function handleMenuActions(action: string, category: CategoryGroup): void {
        switch (action) {
            case 'edit:category':
                setEditCategory(category)
                break
            default: break
        }
    }

    return (
        <Accordion defaultOpen={props.defaultOpen}>
            {props.categories.map(category => (
                <AccordionItem
                    key={category.id}
                    label={category.name}
                    badgeCount={category.skills.length}
                    open={props.defaultOpen}
                    menuActions={groupActions}
                    onMenuAction={function handle(action: string) { handleMenuActions(action, category) }}
                >
                    {() => (
                        <SkillsList skills={category.skills} key={`cat-${category.id}-list`} />
                    )}
                </AccordionItem>
            ))}
        </Accordion>
    )
}

export default CategoriesAccordion
