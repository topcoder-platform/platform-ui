import { FC } from 'react'

import { Button, IconOutline } from '~/libs/ui'

import { GLOBAL_ACTIONS, MENU_ACTIONS } from '../../config'
import { ActionsMenu } from '../actions-menu'
import { StandardizedSkill, StandardizedSkillCategory } from '../../services'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context/skills-manager.context'

import styles from './MoreActionsMenu.module.scss'

const MoreActionsMenu: FC<{}> = () => {
    const {
        setEditCategory,
        setEditSkill,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    function handleMenuActions(action: string): void {
        switch (action) {
            case MENU_ACTIONS.addCategory.action:
                setEditCategory({} as StandardizedSkillCategory)
                break
            case MENU_ACTIONS.addSkill.action:
                setEditSkill({} as StandardizedSkill)
                break
            default: break
        }
    }

    return (
        <div className={styles.stickyContainer}>
            <div className={styles.floatingActionBtn}>
                <ActionsMenu
                    items={GLOBAL_ACTIONS}
                    onAction={handleMenuActions}
                    placement='top-end'
                    strategy='absolute'
                    className={styles.menu}
                >
                    <Button
                        primary
                        size='xl'
                        className={styles.triggerBtn}
                    >
                        <IconOutline.PlusIcon className='icon-xxl' />
                    </Button>
                </ActionsMenu>
            </div>
        </div>
    )
}

export default MoreActionsMenu
