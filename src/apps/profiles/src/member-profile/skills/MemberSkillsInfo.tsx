import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import { isVerifiedSkill, UserEMSISkill, UserProfile } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { EditMemberPropertyBtn, EmptySection } from '../../components'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../config'

import { ModifySkillsModal } from './ModifySkillsModal'
import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const memberEMSISkills: UserEMSISkill[] = useMemo(
        () => (props.profile.emsiSkills || [])
            .sort((a, b) => (+isVerifiedSkill(b.skillSources))
                - (+isVerifiedSkill(a.skillSources)) || a.name.localeCompare(b.name)),
        [props.profile.emsiSkills],
    )

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
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

    return memberEMSISkills ? (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <div className={styles.headerWrap}>
                    <h3>Skills</h3>
                    {
                        canEdit && (
                            <EditMemberPropertyBtn
                                onClick={handleEditSkillsClick}
                            />
                        )
                    }
                </div>
                <a
                    className={styles.legendWrap}
                    href='/'
                >
                    How skills work?
                </a>
            </div>

            <div className={styles.skillsWrap}>
                {memberEMSISkills?.length > 0
                    ? memberEMSISkills.map((memberEMSISkill: UserEMSISkill) => (
                        <div
                            className={classNames(
                                styles.skillItem,
                                isVerifiedSkill(memberEMSISkill.skillSources) ? styles.verifiedSkillItem : '',
                            )}
                            key={memberEMSISkill.id}
                        >
                            {memberEMSISkill.name}
                            {isVerifiedSkill(memberEMSISkill.skillSources) && <IconOutline.CheckCircleIcon />}
                        </div>
                    ))
                    : (
                        <EmptySection
                            title='Topcoder verifies and tracks skills as our members complete projects and challenges.'
                            wide
                            selfMessage='Adding at least five skills will increase your visibility with customers.'
                            isSelf={canEdit}
                        >
                            This member has not yet provided skills, but check back soon as their skills will grow as
                            they complete project tasks.
                        </EmptySection>
                    )}
            </div>

            {
                isEditMode && (
                    <ModifySkillsModal
                        // profile={props.profile}
                        onClose={handleModyfSkillsModalClose}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberSkillsInfo
