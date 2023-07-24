import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { isVerifiedSkill, UserEMSISkill, UserProfile } from '~/libs/core'
import { Skill, SkillPill } from '~/libs/shared'
import { Button } from '~/libs/ui'

import { AddButton, EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes, TALENT_SEARCH_MODE_QUERY_PARAM } from '../../config'
import { MemberProfileContextValue, useMemberProfileContext } from '../MemberProfile.context'

import { ModifySkillsModal } from './ModifySkillsModal'
import { HowSkillsWorkModal } from './HowSkillsWorkModal'
import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)
    const talentSearchQuery: string | null = queryParams.get(TALENT_SEARCH_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const { skillsRenderer }: MemberProfileContextValue = useMemberProfileContext()

    const memberEMSISkills: UserEMSISkill[] = useMemo(
        () => (props.profile.emsiSkills || [])
            .sort((a, b) => (+isVerifiedSkill(b.skillSources))
                - (+isVerifiedSkill(a.skillSources)) || a.name.localeCompare(b.name)),
        [props.profile.emsiSkills],
    )

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [howSkillsWorkVisible, setHowSkillsWorkVisible]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isTalentSearch, setIsTalentSearch]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [skillsToRender, setSkillsToRender]: [number, Dispatch<SetStateAction<number>>]
        = useState<number>(10)

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.skills) {
            setIsEditMode(true)
        }

        if (talentSearchQuery === 'true') {
            setIsTalentSearch(true)
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

    function handleExpandSkillsClick(): void {
        setSkillsToRender(memberEMSISkills.length)
    }

    return memberEMSISkills ? (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <div className={styles.headerWrap}>
                    <h3>Skills</h3>
                    {
                        canEdit && memberEMSISkills?.length > 0 && (
                            <EditMemberPropertyBtn
                                onClick={handleEditSkillsClick}
                            />
                        )
                    }
                </div>
                <Button
                    link
                    label='How skills work?'
                    onClick={handleHowSkillsWorkClick}
                    variant='linkblue'
                />
            </div>

            <div className={styles.skillsWrap}>
                {memberEMSISkills?.length > 0 && (
                    skillsRenderer
                        ? skillsRenderer(props.profile.emsiSkills)
                        : memberEMSISkills.slice(0, skillsToRender)
                            .map((memberEMSISkill: UserEMSISkill) => (
                                <SkillPill
                                    skill={memberEMSISkill as unknown as Skill}
                                    key={memberEMSISkill.id}
                                />
                            ))
                )}
                {!skillsRenderer && memberEMSISkills?.length > skillsToRender && (
                    <Button
                        primary
                        label={`+ ${memberEMSISkills.length - skillsToRender}`}
                        onClick={handleExpandSkillsClick}
                    />
                )}
                {!memberEMSISkills?.length && (
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
            {canEdit && !memberEMSISkills?.length && (
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
                        canEdit={canEdit}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberSkillsInfo
