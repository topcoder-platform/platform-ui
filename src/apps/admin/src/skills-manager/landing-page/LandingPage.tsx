import { FC } from 'react'

import { ContentLayout, PageTitle } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../context'
import {
    CategoriesAccordion,
    CategoryModal,
    MoreActionsMenu,
    PageHeader,
    SearchInput,
    SkillModal,
} from '../components'

import styles from './LandingPage.module.scss'

const LandingPage: FC<{}> = () => {
    const {
        categories,
        setSkillsFilter,
        skillsFilter,
        editCategory,
        editSkill,
        setEditCategory,
        setEditSkill,
        refetchCategories,
        refetchSkills,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    return (
        <ContentLayout innerClass={styles.contentWrap}>
            <PageTitle>Skills Manager | Admin</PageTitle>
            <PageHeader title='Skills Manager' />

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
