import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout } from '~/libs/ui'

import { MemberBasicInfo } from '../basic-info'
import { MemberTracksInfo } from '../tracks'
import { MemberSkillsInfo } from '../skills'
import { CommunityAwards } from '../community-awards'
import { MemberTCAInfo } from '../tca-info'
import { MemberTCActivityInfo } from '../tc-activity'
import ProfilePageJumbo from '../jumbotron/ProfilePageJumbo'

import styles from './ProfilePageLayout.module.scss'

interface ProfilePageLayoutProps {
    profile: UserProfile | undefined
}

const ProfilePageLayout: FC<ProfilePageLayoutProps> = (props: ProfilePageLayoutProps) => (
    <div className={styles.container}>

        <ProfilePageJumbo profile={props.profile} />

        <ContentLayout
            outerClass={styles.contentLayoutOuter}
        >

            <div className={styles.basicInfoWrap}>
                <div className={styles.skillsWrap}>
                    <MemberTracksInfo profile={props.profile} />

                    <MemberSkillsInfo profile={props.profile} />
                </div>
                <MemberBasicInfo profile={props.profile} />
            </div>

            <CommunityAwards profile={props.profile} />

            <MemberTCAInfo profile={props.profile} />

            <MemberTCActivityInfo profile={props.profile} />

        </ContentLayout>

    </div>
)

export default ProfilePageLayout
