import { type ActionsMenuItem } from '../components/actions-menu'

export const ADD_SKILL_ACTION: ActionsMenuItem = {
    action: 'add:skill',
    label: 'Add Skill',
}

export const ADD_CATEGORY_ACTION: ActionsMenuItem = {
    action: 'add:category',
    label: 'Add Category',
}

export const EDIT_CATEGORY_ACTION: ActionsMenuItem = {
    action: 'edit:category',
    label: 'Edit Category',
}

export const BULK_EDIT_SKILLS_ACTION: ActionsMenuItem = {
    action: 'bulk:edit:skill',
    label: 'Bulk Edit Skills',
}

export const GLOBAL_ACTIONS: ActionsMenuItem[] = [
    ADD_SKILL_ACTION,
    ADD_CATEGORY_ACTION,
]

export const MENU_ACTIONS = {
    addCategory: ADD_CATEGORY_ACTION,
    addSkill: ADD_SKILL_ACTION,
    bulkEditSkills: BULK_EDIT_SKILLS_ACTION,
    editCategory: EDIT_CATEGORY_ACTION,
}

export const CATEGORY_ITEM_ACTIONS: ActionsMenuItem[] = [
    EDIT_CATEGORY_ACTION,
    BULK_EDIT_SKILLS_ACTION,
]

export enum BULK_SKILL_ACTIONS {
    move = 'bulk:move:skills',
    replace = 'bulk:replace:skills',
    archive = 'bulk:archive:skills',
}
