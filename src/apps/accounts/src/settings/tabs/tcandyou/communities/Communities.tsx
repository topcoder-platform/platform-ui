import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { bind } from 'lodash'
import { KeyedMutator } from 'swr'
import { toast } from 'react-toastify'

import { updateOrCreateMemberTraitsAsync, useMemberTraits, UserProfile, UserTraits } from '~/libs/core'
import { Button, Collapsible, FormToggleSwitch } from '~/libs/ui'
import { triggerSprigSurvey } from '~/apps/accounts/src/lib'

import { communitiesConfig } from './communities-config'
import styles from './Communities.module.scss'

interface CommunitiesProps {
    communityTraits: UserTraits | undefined
    profile: UserProfile
}

interface CommunitiesDataStatus {
    [key: string]: boolean
}

const Communities: FC<CommunitiesProps> = (props: CommunitiesProps) => {
    const [memberCommunities, setMemberCommunities]: [
        CommunitiesDataStatus | undefined,
        Dispatch<SetStateAction<CommunitiesDataStatus | undefined>>
    ]
        = useState<CommunitiesDataStatus | undefined>()

    const { mutate: mutateTraits }: { mutate: KeyedMutator<any> } = useMemberTraits(props.profile.handle)

    useEffect(() => {
        setMemberCommunities(props.communityTraits?.traits.data[0])
    }, [props.communityTraits])

    function handleCommunitiesChange(communityId: string): void {
        const updatedCommunities: CommunitiesDataStatus = {
            ...memberCommunities,
            [communityId]: !memberCommunities?.[communityId],
        }

        updateOrCreateMemberTraitsAsync(props.profile.handle, [{
            categoryName: 'Communities',
            traitId: 'communities',
            traits: {
                data: [updatedCommunities],
            },
        }])
            .then(() => {
                setMemberCommunities(updatedCommunities)
                mutateTraits()
                toast.success('Communities updated successfully.')
                triggerSprigSurvey(props.profile)
            })
            .catch(() => {
                toast.error('Failed to update user Communities.')
            })
    }

    function handleLearnMoreClick(link: string): void {
        window.open(link, '_blank')
    }

    return (
        <Collapsible
            header={<h3>Your Communities</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                communitiesConfig.map(community => (
                    <div className={styles.communityCard} key={community.id}>
                        <div className={styles.communityCardHeader}>
                            <img src={community.icon} alt={community.name} />
                            <div className={styles.communityInfo}>
                                <p className='body-main-bold'>{community.name}</p>
                                <p className={styles.infoText}>{community.description}</p>
                                <Button
                                    secondary
                                    size='sm'
                                    label='Learn More'
                                    onClick={bind(handleLearnMoreClick, this, community.link)}
                                />
                            </div>
                        </div>
                        <FormToggleSwitch
                            name={community.id}
                            onChange={bind(handleCommunitiesChange, this, community.id)}
                            value={memberCommunities?.[community.id] || false}
                        />
                    </div>
                ))
            }
        </Collapsible>
    )
}

export default Communities
