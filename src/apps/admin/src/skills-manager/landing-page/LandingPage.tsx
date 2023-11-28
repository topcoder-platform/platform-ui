import { FC } from 'react'

import { ContentLayout, InputCheckbox, PageTitle } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../context'
import {
    CategoriesAccordion,
    CategoryModal,
    MoreActionsMenu,
    PageHeader,
    SearchInput,
    SkillModal,
} from '../components'
import { BulkEditor } from '../components/bulk-editor'

import styles from './LandingPage.module.scss'

const LandingPage: FC<{}> = () => {
    const {
        bulkEditorCtx,
        categories,
        setSkillsFilter,
        skillsFilter,
        editCategory,
        editSkill,
        setEditCategory,
        setEditSkill,
        refetchCategories,
        refetchSkills,
        toggleArchivedSkills,
        showArchivedSkills,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    return (
        <ContentLayout innerClass={styles.contentWrap}>
            <PageTitle>Skills Manager | Admin</PageTitle>
            <PageHeader title='Skills Manager'>
                <InputCheckbox
                    accent='blue'
                    name='show archived'
                    label='Show Archived'
                    onChange={toggleArchivedSkills}
                    checked={showArchivedSkills}
                />

                {!!bulkEditorCtx.isEditing && (
                    <BulkEditor className={styles.toRight} />
                )}
            </PageHeader>

            <SearchInput value={skillsFilter} onChange={setSkillsFilter} />

            <div className={styles.contentAccordion}>
                <CategoriesAccordion defaultOpen={!!skillsFilter} />
            </div>

            <MoreActionsMenu />

            {!!editCategory && (
                <CategoryModal
                    category={editCategory}
                    onClose={function close() { setEditCategory() }}
                    onSave={function refresh() { refetchCategories() }}
                />
            )}

            {!!editSkill && (
                <SkillModal
                    skill={editSkill}
                    categories={categories}
                    onClose={function close() { setEditSkill() }}
                    onSave={function refresh() { refetchSkills() }}
                />
            )}
        </ContentLayout>
    )
}

export default LandingPage
