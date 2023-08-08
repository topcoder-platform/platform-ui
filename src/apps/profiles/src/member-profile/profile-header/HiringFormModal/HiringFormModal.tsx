import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { BaseModal } from '~/libs/ui'

interface HiringFormModalProps {
    onClose: () => void
    authProfile: UserProfile | undefined
    profile: UserProfile
    searchedSkills: string[]
}

function populateIframeForm(profile: UserProfile, authProfile: any | undefined, searchedSkills: string[]): string {
    const formUrl = `https://go.topcoder.com/talent-search-intake?handle=${profile.handle}`

    if (authProfile) {
        return `${formUrl}
&first_name=${authProfile.firstName}
&last_name=${authProfile.lastName}
&email=${authProfile.email}
&searched_skills=${searchedSkills.join(',')}`
    }

    return formUrl
}

const HiringFormModal: FC<HiringFormModalProps> = (props: HiringFormModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title={(
            <p className='body-large-bold'>
                Interested in working with one of our experts?
                <br />
                Start with this form.
            </p>
        )}
        size='lg'
    >
        <iframe
            src={populateIframeForm(props.profile, props.authProfile, props.searchedSkills)}
            title='Start Hiring Form'
            id='start-hiring-form'
        />
    </BaseModal>
)

export default HiringFormModal
