import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import {
    Button,
    ContentLayout,
    DefaultMemberIcon,
    fileDownloadCanvasAsImage,
    IconOutline,
    Tooltip,
    UserProfile,
    VerifiedMemberFlagSvg,
} from '../../../../lib'
import {
    ActionButton,
    CourseBadge,
    SkillTags,
    TCACertificatePreview,
    TCACertificateType,
    TCACertification,
    TCACertificationResource,
    TCAShareCertificateModalData,
    useCertificateCanvas,
    useCertificatePrint,
    useTCAShareCertificateModal,
} from '..'
import { getTCACertificationPath, getUserTCACertificateSsr } from '../../learn.routes'
import { clearFCCCertificationTitle } from '../functions'
import { EnvironmentConfig } from '../../../../config'

import { CertificateModal } from './certificate-modal'
import styles from './HiringManagerView.module.scss'

function renderBasicList(items: Array<string> = []): ReactNode {
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
    isOwner?: boolean
    userProfile?: UserProfile
    userName?: string
    validationUrl?: string
}

const HiringManagerView: FC<HiringManagerViewProps> = (props: HiringManagerViewProps) => {
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [certPreviewModalIsOpen, setCertPreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const {
        certificationResources: courses = [],
        learnedOutcomes,
        certificationCategory,
    }: TCACertification = (props.certification ?? {} as TCACertification)

    const certificationTitle: string = `${props.userName} - ${props.certification?.title} Certificate`

    const myProfileLink: string = `${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${props.userProfile?.handle}`

    const certificationDetailsLink: string = getTCACertificationPath(
        `${props.certification?.dashedName}`,
    )

    const ssrCertUrl: string = getUserTCACertificateSsr(
        `${props.certification?.dashedName}`,
        `${props.userProfile?.handle}`,
        certificationTitle,
    )
    const shareModal: TCAShareCertificateModalData = useTCAShareCertificateModal(ssrCertUrl)

    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void>
        = useCertificateCanvas(certificateElRef)

    const handleDownload: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!!canvas) {
            fileDownloadCanvasAsImage(canvas, `${certificationTitle}.png`)
        }

    }, [certificationTitle, getCertificateCanvas])

    const handlePrint: () => Promise<void>
        = useCertificatePrint(certificateElRef, certificationTitle ?? '')

    function handleShowCertPreviewModal(): void {
        setCertPreviewModalIsOpen(true)
    }

    function handleHideCertPreviewModal(): void {
        setCertPreviewModalIsOpen(false)
    }

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

    function renderTCACertificatePreview(): ReactNode {
        return (
            <TCACertificatePreview
                certification={props.certification}
                userName={props.userName}
                completedDate={props.completedAt}
                completionUuid={props.completionUuid}
                validateLink={props.validationUrl}
                certificateElRef={certificateElRef}
                maxScale={Math.min()}
            />
        )
    }

    function renderHero(): ReactNode {
        if (!props.certification || !props.userProfile) {
            return <></>
        }

        return (
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
                            <div className={styles.certTitle}>{props.certification.title}</div>
                            <p className='body-large'>
                                Certification was successfully completed.
                            </p>
                        </div>
                        <div className={styles.heroCertWrap}>
                            <div className={styles.heroCert}>
                                {renderTCACertificatePreview()}

                                <div className={styles.certActionBtns}>
                                    <ActionButton
                                        icon={<IconOutline.ZoomInIcon />}
                                        className={classNames(styles.certZoomBtn, styles.certActionBtn)}
                                        onClick={handleShowCertPreviewModal}
                                    />
                                    {props.isOwner && (
                                        <>
                                            <ActionButton
                                                className={classNames('desktop-hide', styles.certActionBtn)}
                                                icon={<IconOutline.PrinterIcon />}
                                                onClick={handlePrint}
                                            />
                                            <ActionButton
                                                className={classNames('desktop-hide', styles.certActionBtn)}
                                                icon={<IconOutline.DownloadIcon />}
                                                onClick={handleDownload}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                            {props.isOwner && (
                                <div className={classNames('mobile-hide', styles.certActionBtns)}>
                                    <ActionButton
                                        className={styles.certActionBtn}
                                        icon={<IconOutline.PrinterIcon />}
                                        onClick={handlePrint}
                                    />
                                    <ActionButton
                                        className={styles.certActionBtn}
                                        icon={<IconOutline.DownloadIcon />}
                                        onClick={handleDownload}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </ContentLayout>
            </div>
        )
    }

    return !!props.certification && !!props.userProfile ? (
        <div>
            {renderHero()}

            <ContentLayout
                contentClass={styles.contentWrap}
                outerClass={styles.outerContentWrap}
                innerClass={styles.innerContentWrap}
            >
                <div className={styles.wrap}>
                    {props.isOwner && (
                        <Button
                            buttonStyle='primary'
                            icon={IconOutline.ShareIcon}
                            label='Share your Certification'
                            className={styles.shareBtn}
                            onClick={shareModal.show}
                        />
                    )}

                    <div className={styles.colsWrap}>
                        <div className={styles.colWrap}>
                            <h2>Concepts learned:</h2>

                            {renderBasicList(learnedOutcomes)}
                        </div>
                        <div className={styles.colSeparator} />
                        <div className={styles.colWrap}>
                            <h2>Skills gained:</h2>

                            <SkillTags
                                skills={props.certification?.skills ?? []}
                                theme='gray'
                                label=''
                                expandCount={props.certification?.skills?.length ?? 0}
                            />

                            <Button
                                buttonStyle='secondary'
                                label={props.isOwner ? 'View your Topcoder profile' : 'View full Topcoder profile'}
                                url={myProfileLink}
                                target='_blank'
                                className={styles.shareBtn}
                            />
                        </div>
                    </div>

                    {renderCoursesGridItems()}

                    <Button
                        className={styles.detailsBtn}
                        buttonStyle='link'
                        label='Certification details'
                        route={certificationDetailsLink}
                    />
                </div>
            </ContentLayout>
            {shareModal.modal}
            {certPreviewModalIsOpen && (
                <CertificateModal open onClose={handleHideCertPreviewModal}>
                    {renderTCACertificatePreview()}
                </CertificateModal>
            )}
        </div>
    ) : <></>
}

export default HiringManagerView
