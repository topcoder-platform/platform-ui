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
        categories,
        bulkEditorCtx,
        setSkillsFilter,
        skillsFilter,
        editCategory,
        editSkill: showSkillModal,
        setEditCategory,
        refetchCategories,
        toggleArchivedSkills,
        showArchivedSkills,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    return (
        <ContentLayout innerClass={styles.contentWrap}>
            <PageTitle>Skills Manager | Admin</PageTitle>
            <PageHeader title='Skills Manager'>
                <InputCheckbox
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
                    categories={categories}
                    category={editCategory}
                    onClose={function close() { setEditCategory() }}
                    onSave={function refresh() { refetchCategories() }}
                />
            )}

            {!!showSkillModal && <SkillModal skill={showSkillModal} />}
        </ContentLayout>
    )
}

export default LandingPage
