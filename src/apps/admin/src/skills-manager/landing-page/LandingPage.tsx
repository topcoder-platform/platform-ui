import { FC } from 'react'

import { ContentLayout, PageTitle } from '~/libs/ui'

import { CategoriesAccordion, CategoryModal, PageHeader, SearchInput } from '../components'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../skills-manager.context'

const LandingPage: FC<{}> = () => {
    const {
        groupedSkills,
        setSkillsFilter,
        skillsFilter,
        editCategory,
        setEditCategory,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    return (
        <ContentLayout>
            <PageTitle>Skills Manager | Admin</PageTitle>
            <PageHeader title='Skills Manager' />

            <SearchInput value={skillsFilter} onChange={setSkillsFilter} />

            <CategoriesAccordion
                defaultOpen={!!skillsFilter}
                categories={groupedSkills}
            />

            {!!editCategory && (
                <CategoryModal
                    category={editCategory}
                    onClose={function close() { setEditCategory() }}
                />
            )}
        </ContentLayout>
    )
}

export default LandingPage
