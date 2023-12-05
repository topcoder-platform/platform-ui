import { FC, ReactNode } from 'react'
import { Location, useLocation } from 'react-router-dom'

import { MemberProfileContext, MemberProfilePage } from '@profiles/member-profile'
import { UserSkill } from '~/libs/core'

import { ProfileSkillsMatch } from '../../components/profile-skills-match'
import { getTalentStatsRoute } from '../../talent-search.routes'

const TalentPage: FC = () => {
    const { state }: Location = useLocation()

    function skillsRenderer(profileSkills: Pick<UserSkill, 'name'|'id'|'levels'>[]): ReactNode {
        return (
            <ProfileSkillsMatch
                matchValue={state.matchValue}
                profileSkills={profileSkills}
                queriedSkills={state.queriedSkills}
                key='profile-skills'
            />
        )
    }

    return (
        <MemberProfileContext
            statsRoute={getTalentStatsRoute}
            isTalentSearch={!!state}
            skillsRenderer={state ? skillsRenderer : undefined}
        >
            <MemberProfilePage />
        </MemberProfileContext>
    )
}

export default TalentPage
