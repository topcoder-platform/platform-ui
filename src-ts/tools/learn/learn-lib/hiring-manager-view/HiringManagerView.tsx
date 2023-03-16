import {
    FC,
    ReactNode,
} from 'react'
import classNames from 'classnames'

import {
    Button,
    ContentLayout,
    DefaultMemberIcon,
    IconOutline,
    Tooltip,
    UserProfile,
    VerifiedMemberFlagSvg,
} from '../../../../lib'
import {
    CourseBadge,
    TCACertificatePreview,
    TCACertificateType,
    TCACertification,
    TCACertificationResource,
} from '..'
import { EnvironmentConfig } from '../../../../config'
import { clearFCCCertificationTitle } from '../functions'

import styles from './HiringManagerView.module.scss'

function renderBasicList(items: Array<string>): ReactNode {
    return (
        <ul className='body-main'>
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    )
}

export interface HiringManagerViewProps {
    certification?: TCACertification
    completedAt?: string
    completionUuid?: string
    isModalView?: boolean
    isMemberVerified?: boolean
    userProfile?: UserProfile
    userName?: string
    validationUrl?: string
}

const HiringManagerView: FC<HiringManagerViewProps> = (props: HiringManagerViewProps) => {
    const {
        certificationResources: courses = [],
        learnedOutcomes,
        certificationCategory,
    }: TCACertification = (props.certification ?? {} as TCACertification)

    function renderCoursesGridItems(): ReactNode {
        return (
            <div className={styles.courses}>
                <h2>Courses Taken</h2>
                <div className={styles.coursesGrid}>
                    {courses.map((course: TCACertificationResource) => (
                        <div className={styles.courseCard} key={course.freeCodeCampCertification.fccId}>
                            <CourseBadge type={certificationCategory?.track as TCACertificateType} />
                            <p className='body-main-bold'>
                                {clearFCCCertificationTitle(course.freeCodeCampCertification.title)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    function visitFullProfile(): void {
        window.open(`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${props.userProfile?.handle}`, '_blank')
    }

    return !!props.certification && !!props.userProfile ? (
        <div className={props.isModalView ? styles.modalView : ''}>
            <div
                className={classNames(
                    styles.hero,
                    styles[`hero-${certificationCategory?.track.toLowerCase() || 'dev'}`],
                )}
            >
                <ContentLayout outerClass={props.isModalView ? styles.contentOuter : ''}>
                    <div className={styles.heroInner}>
                        <div className={styles.heroLeft}>
                            <div className={styles.member}>
                                {
                                    props.userProfile.photoURL ? (
                                        <img src={props.userProfile.photoURL} alt='Member Avatar' />
                                    ) : (
                                        <DefaultMemberIcon />
                                    )
                                }
                                <div className={styles.memberInfo}>
                                    <p className='body-large-bold'>{props.userName}</p>
                                    <p className='body-large-medium'>{props.userProfile.handle}</p>
                                    {
                                        props.isMemberVerified ? (
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
                                        ) : undefined
                                    }
                                </div>
                            </div>
                            <p className={classNames(props.isModalView ? 'body-medium' : 'body-large')}>
                                {props.userName}
                                {' '}
                                has successfully completed the certification
                            </p>
                            <div className={styles.certTitle}>{props.certification.title}</div>
                        </div>
                        <div className={styles.heroCert}>
                            <TCACertificatePreview
                                certification={props.certification}
                                userName={props.userName}
                                completedDate={props.completedAt}
                                completionUuid={props.completionUuid}
                                validateLink={props.validationUrl}
                            />
                        </div>
                    </div>
                </ContentLayout>
            </div>

            <ContentLayout outerClass={props.isModalView ? styles.contentOuter : ''}>
                <div className={styles.wrap}>
                    <h2>
                        {'What '}
                        {props.userName}
                        {' Learned?'}
                    </h2>
                    <ul>{renderBasicList(learnedOutcomes)}</ul>

                    {renderCoursesGridItems()}
                    {!props.isModalView && (
                        <Button
                            buttonStyle='link'
                            label='Visit Full Profile'
                            onClick={visitFullProfile}
                        />
                    )}
                </div>
            </ContentLayout>
        </div>
    ) : <></>
}

export default HiringManagerView
