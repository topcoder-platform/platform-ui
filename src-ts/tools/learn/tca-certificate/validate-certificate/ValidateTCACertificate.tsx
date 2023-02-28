import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useEffect,
    useLayoutEffect,
    useMemo, useRef,
    useState,
} from 'react'
import { Params, useParams, useSearchParams } from 'react-router-dom'
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
    TCACertificatePreview,
    TCACertificateType,
    TCACertification,
    TCACertificationEnrollmentProviderData,
    useTCACertificationEnrollment,
} from '../../learn-lib'
import { EnvironmentConfig } from '../../../../config'
import { getTCACertificationValidationUrl } from '../../learn.routes'
import { clearFCCCertificationTitle, hideSiblings } from '../../learn-lib/functions'

import styles from './ValidateTCACertificate.module.scss'

const ValidateTCACertificate: FC<{}> = () => {

    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()

    const routeParams: Params<string> = useParams()
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

    const isModalView: boolean = queryParams.get('view-style') === 'modal'

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const {
        enrollment,
        ready: certReady,
    }: TCACertificationEnrollmentProviderData
        = useTCACertificationEnrollment(routeParams.completionUuid as string)

    const certification: TCACertification | undefined = enrollment?.topcoderCertification

    const courses: any = certification?.certificationResources

    const learnedOutcomes: ReactNode[] | undefined
        = useMemo(() => certification?.learnedOutcomes?.map((lO: string) => <li key={lO}>{lO}</li>), [certification])

    const coursesGridItems: ReactNode[] | undefined
        = useMemo(() => courses?.map((course: any) => (
            <div className={styles.courseCard} key={course.freeCodeCampCertification.fccId}>
                <CourseBadge type={certification?.certificationCategory.track as TCACertificateType} />
                <p className='body-main-bold'>
                    {clearFCCCertificationTitle(course.freeCodeCampCertification.title)}
                </p>
            </div>
        )), [courses, certification])

    // TODO: update this to use `completionUuid`
    const validateLink: string
        = getTCACertificationValidationUrl(routeParams.completionUuid as string)

    useEffect(() => {
        if (enrollment?.userHandle) {
            profileGetPublicAsync(enrollment.userHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [enrollment, setProfileReady])

    useLayoutEffect(() => {
        const el: HTMLElement = wrapElRef.current
        if (!el || !isModalView) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)

    })

    function visitFullProfile(): void {
        window.open(`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${profile?.handle}`, '_blank')
    }

    return (
        <>
            <LoadingSpinner hide={profileReady && certReady} />

            {profile && certification && (
                <div className={classNames('full-height-frame', isModalView ? styles.modalView : '')} ref={wrapElRef}>
                    <div
                        className={classNames(
                            styles.hero,
                            styles[`hero-${certification.certificationCategory?.track.toLowerCase() || 'dev'}`],
                        )}
                    >
                        <ContentLayout outerClass={isModalView ? styles.contentOuter : ''}>
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
                                            <p className='body-large-bold'>{enrollment?.userName}</p>
                                            <p className='body-large-medium'>{profile.handle}</p>
                                            <div className={styles.verifyStatus}>
                                                <VerifiedMemberFlagSvg />
                                                <span className='overline'>verified member</span>
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
                                    <p className={classNames(isModalView ? 'body-medium' : 'body-large')}>
                                        {enrollment?.userName}
                                        {' '}
                                        has successfully completed the certification
                                    </p>
                                    <div className={styles.certTitle}>{certification.title}</div>
                                </div>
                                <div className={styles.heroCert}>
                                    <TCACertificatePreview
                                        certification={certification}
                                        userName={enrollment?.userName}
                                        completedDate={enrollment?.completedAt ?? undefined}
                                        completionUuid={routeParams.completionUuid}
                                        validateLink={validateLink}
                                    />
                                </div>
                            </div>
                        </ContentLayout>
                    </div>

                    <ContentLayout outerClass={isModalView ? styles.contentOuter : ''}>
                        <div className={styles.wrap}>
                            <h2>
                                {'What '}
                                {enrollment?.userName}
                                {' Learned?'}
                            </h2>
                            <ul>{learnedOutcomes}</ul>

                            <div className={styles.courses}>
                                <h2>Courses Taken</h2>
                                <div className={styles.coursesGrid}>
                                    {coursesGridItems}
                                </div>
                            </div>
                            {
                                !isModalView && (
                                    <Button
                                        buttonStyle='link'
                                        label='Visit Full Profile'
                                        onClick={visitFullProfile}
                                    />
                                )
                            }
                        </div>
                    </ContentLayout>
                </div>
            )}
        </>
    )
}

export default ValidateTCACertificate
