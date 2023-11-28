import { FC, useMemo } from 'react'

import { Accordion, AccordionItem } from '../accordion'
import { SkillsList } from '../skills-list'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'
import { StandardizedSkillCategory } from '../../services'
import { CATEGORY_ITEM_ACTIONS, MENU_ACTIONS } from '../../config'

interface CategoriesAccordionProps {
    defaultOpen?: boolean
}

const CategoriesAccordion: FC<CategoriesAccordionProps> = props => {
    const {
        setEditSkill,
        skillsFilter,
        setEditCategory,
        categories,
        groupedSkills,
        bulkEditorCtx,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    function handleMenuActions(action: string, category: StandardizedSkillCategory): void {
        switch (action) {
            case MENU_ACTIONS.editCategory.action:
                setEditCategory(category)
                break
            case MENU_ACTIONS.bulkEditSkills.action:
                bulkEditorCtx.toggle(category)
                break
            default: break
        }
    }

    function renderCategoryAccordion(category: StandardizedSkillCategory): JSX.Element {
        const categorySkills = groupedSkills[category.id] ?? []

        return (!skillsFilter || categorySkills.length > 0) ? (
            <AccordionItem
                key={category.id}
                label={category.name}
                badgeCount={categorySkills.length}
                open={props.defaultOpen || !!bulkEditorCtx.isEditing}
                menuActions={CATEGORY_ITEM_ACTIONS}
                onMenuAction={function handle(action: string) { handleMenuActions(action, category) }}
            >
                {() => (
                    <SkillsList
                        skills={categorySkills}
                        key={`cat-${category.id}-list`}
                        onSelect={bulkEditorCtx.toggleSkill}
                        isSelected={bulkEditorCtx.isSkillSelected}
                        editMode={!!bulkEditorCtx.isEditing}
                        onEditSkill={setEditSkill}
                    />
                )}
            </AccordionItem>
        ) : <></>
    }

    // use a memo to persist the items rendering
    // otheriwse, the order and mapping of the categories
    // will trigger a new re-render of the accordion on each context change
    const accordionItems = useMemo(() => (
        !!bulkEditorCtx.isEditing ? (
            renderCategoryAccordion(bulkEditorCtx.isEditing)
        ) : (
            categories
                .map(renderCategoryAccordion)
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [bulkEditorCtx.isEditing, categories, groupedSkills])

    return (
        <Accordion defaultOpen={props.defaultOpen}>
            {accordionItems}
        </Accordion>
    )
}

export default CategoriesAccordion
