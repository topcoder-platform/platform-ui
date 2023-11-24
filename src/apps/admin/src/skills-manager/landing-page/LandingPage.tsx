import { FC } from 'react'

import { ContentLayout, PageTitle } from '~/libs/ui'

import { CategoriesAccordion, PageHeader, SearchInput } from '../components'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../skills-manager.context'

const LandingPage: FC<{}> = () => {
    const {
        groupedSkills,
        setSkillsFilter,
        skillsFilter,
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
        </ContentLayout>
    )
}

export default LandingPage
