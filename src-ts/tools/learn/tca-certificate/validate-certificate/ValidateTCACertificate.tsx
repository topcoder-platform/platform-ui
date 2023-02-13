import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'
import { Params, useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    Button,
    ContentLayout,
    DefaultMemberIcon,
    IconOutline,
    LoadingSpinner,
    profileGetPublicAsync,
    Tooltip,
    UserProfile,
    VerifiedMemberFlagSvg,
} from '../../../../lib'
import {
    CourseBadge,
    TCACertification,
    TCACertificationProgressProviderData,
    useGetTCACertificationProgress,
} from '../../learn-lib'
import { EnvironmentConfig } from '../../../../config'
import { Certificate } from '../certificate-view/certificate'

import styles from './ValidateTCACertificate.module.scss'

const ValidateTCACertificate: FC<{}> = () => {

    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    // Fetch Enrollment status & progress
    const {
        progress,
        ready: progressReady,
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        profile?.userId as unknown as string,
        routeParams.certification as string,
        { enabled: profileReady && !!profile },
    )

    // TODO: see if need to remap if provider hook changes
    const certification: TCACertification | undefined = progress?.topcoderCertification
    const courses: any = progress?.resourceProgresses

    const learningOutcomes: ReactNode[] | undefined
        = useMemo(() => certification?.learningOutcomes.map((lO: string) => <li>{lO}</li>), [certification])

    const coursesGridItems: ReactNode[] | undefined
        = useMemo(() => courses?.map((course: any) => (
            <div className={styles.courseCard}>
                <CourseBadge type={course.fccCertificationProgress.certificationTrackType} />
                <p className='body-main-bold'>{course.fccCertificationProgress.certificationTitle}</p>
            </div>
        )), [courses])

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [routeParams.memberHandle, setProfileReady])

    function visitFullProfile(): void {
        window.open(`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${profile?.handle}`, '_blank')
    }

    return (
        <>
            <LoadingSpinner hide={profileReady && progressReady} />

            {profile && certification && (
                <div className='full-height-frame'>
                    <div
                        className={classNames(
                            styles.hero,
                            // TODO: check on API response if category is expanded
                            styles[`hero-${certification.certificationCategory?.track.toLowerCase() || 'dev'}`],
                        )}
                    >
                        <ContentLayout>
                            <div className={styles.heroInner}>
                                <div className={styles.heroLeft}>
                                    <div className={styles.member}>
                                        {
                                            profile.photoURL ? (
                                                <img src={profile.photoURL} alt='Member Avatar' />
                                            ) : (
                                                <DefaultMemberIcon />
                                            )
                                        }
                                        <div className={styles.memberInfo}>
                                            <p className='body-large-medium'>{profile.handle}</p>
                                            <div className={styles.verifyStatus}>
                                                <VerifiedMemberFlagSvg />
                                                <span>verified member</span>
                                                <Tooltip
                                                    trigger={(
                                                        <IconOutline.InformationCircleIcon
                                                            className={styles.toolTipIcon}
                                                        />
                                                    )}
                                                    content={`This member is compliant with Topcoder policies
                                                     and is a trusted member of the Topcoder community.`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className='body-large'>
                                        {profile.handle}
                                        {' '}
                                        has successfully met the requirements of the certification
                                    </p>
                                    <div className={styles.certTitle}>{certification.title}</div>
                                </div>
                                <div className={styles.heroCert}>
                                    <Certificate
                                        certification={certification}
                                        completedDate={progress?.completedAt as unknown as string || '1.1.2023'}
                                        tcHandle={profile.handle}
                                        viewStyle='small-container'
                                    />
                                </div>
                            </div>
                        </ContentLayout>
                    </div>

                    <ContentLayout>
                        <div className={styles.wrap}>
                            <h2>
                                {'What '}
                                {profile.handle}
                                {' Learned?'}
                            </h2>
                            <ul>{learningOutcomes}</ul>

                            <div className={styles.courses}>
                                <h2>Courses Taken</h2>
                                <div className={styles.coursesGrid}>
                                    {coursesGridItems}
                                </div>
                            </div>

                            <Button
                                buttonStyle='link'
                                label='Visit Full Profile'
                                onClick={visitFullProfile}
                            />
                        </div>
                    </ContentLayout>
                </div>
            )}
        </>
    )
}

export default ValidateTCACertificate
