import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderBy } from 'lodash'

import { UserProfile } from '~/libs/core'
import { ExpandableList, HowSkillsWorkModal, isSkillVerified, Skill, SkillPill } from '~/libs/shared'
import { Button } from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'
import { MemberProfileContextValue, useMemberProfileContext } from '../MemberProfile.context'

import { ModifySkillsModal } from './ModifySkillsModal'
import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const { skillsRenderer, isTalentSearch }: MemberProfileContextValue = useMemberProfileContext()

    const memberSkills: Skill[] = useMemo(() => orderBy(
        props.profile.emsiSkills ?? [],
        [isSkillVerified, 'name'],
        ['desc', 'asc'],
    ) as Skill[], [props.profile.emsiSkills])

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [howSkillsWorkVisible, setHowSkillsWorkVisible]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.skills) {
            setIsEditMode(true)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleEditSkillsClick(): void {
        setIsEditMode(true)
    }

    function handleModyfSkillsModalClose(): void {
        setIsEditMode(false)
    }

    function handleModyfSkillsSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.refreshProfile(props.profile.handle)
        }, 1500)
    }

    function handleHowSkillsWorkClick(): void {
        setHowSkillsWorkVisible(true)
    }

    function handleHowSkillsWorkClose(): void {
        setHowSkillsWorkVisible(false)
    }

    return (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <div className={styles.headerWrap}>
                    <h3>Skills</h3>
                    {
                        canEdit && memberSkills.length > 0 && (
                            <EditMemberPropertyBtn
                                onClick={handleEditSkillsClick}
                            />
                        )
                    }
                </div>
                <Button
                    link
                    label='How skills work'
                    onClick={handleHowSkillsWorkClick}
                    variant='linkblue'
                />
            </div>

            <div className={styles.skillsWrap}>
                {skillsRenderer && memberSkills.length > 0 && skillsRenderer(memberSkills)}
                {!skillsRenderer && memberSkills.length > 0 && (
                    <ExpandableList visible={10} itemLabel='skill'>
                        {
                            memberSkills
                                .map(memberEMSISkill => (
                                    <SkillPill
                                        skill={memberEMSISkill as unknown as Skill}
                                        key={memberEMSISkill.id}
                                        theme='dark'
                                    />
                                ))
                        }
                    </ExpandableList>
                )}
                {!memberSkills.length && (
                    <EmptySection
                        title='Topcoder verifies and tracks skills as our members complete projects and challenges.'
                        wide
                        selfMessage='Adding at least three skills will increase your visibility with customers.'
                        isSelf={canEdit}
                    >
                        This member has not yet provided skills, but check back soon as their skills will grow as
                        they complete project tasks.
                    </EmptySection>
                )}
            </div>
            {canEdit && !memberSkills.length && (
                <AddButton
                    label='Add skills'
                    onClick={handleEditSkillsClick}
                />
            )}

            {
                isEditMode && (
                    <ModifySkillsModal
                        onClose={handleModyfSkillsModalClose}
                        onSave={handleModyfSkillsSave}
                    />
                )
            }

            {
                howSkillsWorkVisible && (
                    <HowSkillsWorkModal
                        onClose={handleHowSkillsWorkClose}
                        isTalentSearch={isTalentSearch}
                        iseSelfView={canEdit}
                    />
                )
            }
        </div>
    )
}

export default MemberSkillsInfo
