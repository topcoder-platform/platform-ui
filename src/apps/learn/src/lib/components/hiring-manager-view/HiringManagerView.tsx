/* eslint-disable complexity */
import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import {
    Button,
    ContentLayout,
    DefaultMemberIcon,
    IconOutline,
    LinkButton,
    Tooltip,
    VerifiedMemberFlagSvg,
} from '~/libs/ui'
import { EnvironmentConfig } from '~/config'
import { UserProfile } from '~/libs/core'
import { downloadCanvasAsImage } from '~/libs/shared'

import {
    ActionButton,
    CourseBadge,
    SkillTags,
    TCACertificatePreview,
    TCAShareCertificateModalData,
    useCertificateCanvas,
    useCertificatePrint,
    useTCAShareCertificateModal,
} from '..'
import {
    TCACertificateType,
    TCACertification,
    TCACertificationResource,
} from '../../data-providers'
import { getTCACertificationPath, getUserTCACertificateSsr } from '../../../learn.routes'
import { clearFCCCertificationTitle, hideSiblings } from '../../functions'

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
    isPreview?: boolean
    isModalView?: boolean
    isMemberVerified?: boolean
    isOwner?: boolean
    userProfile?: UserProfile
    userName?: string
    validationUrl?: string
}

// eslint-disable-next-line complexity
const HiringManagerView: FC<HiringManagerViewProps> = (props: HiringManagerViewProps) => {
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()

    const [certPreviewModalIsOpen, setCertPreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const {
        certificationResources: courses = [],
        learnedOutcomes,
        certificationCategory,
    }: TCACertification = (props.certification ?? {} as TCACertification)

    const certificationTitle: string = `${props.userName} - ${props.certification?.title} Certificate`

    const myProfileLink: string = `${EnvironmentConfig.URLS.USER_PROFILE}/${props.userProfile?.handle}`

    const certificationDetailsLink: string = getTCACertificationPath(
        `${props.certification?.dashedName}`,
    )

    const ssrCertUrl: string = getUserTCACertificateSsr(
        `${props.certification?.dashedName}`,
        `${props.userProfile?.handle}`,
        certificationTitle,
    )
    const shareModal: TCAShareCertificateModalData = useTCAShareCertificateModal(ssrCertUrl)

    const renderShareActions: boolean = useMemo(() => (
        !!props.isOwner && !props.isModalView
    ), [props.isOwner, props.isModalView])

    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void>
        = useCertificateCanvas(certificateElRef)

    const handleDownload: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!!canvas) {
            downloadCanvasAsImage(canvas, `${certificationTitle}.png`)
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

    function renderTCACertificatePreview(ref?: MutableRefObject<HTMLDivElement | any>): ReactNode {
        return (
            <TCACertificatePreview
                certification={props.certification as TCACertification}
                userName={props.userName}
                completedDate={props.completedAt}
                completionUuid={props.completionUuid}
                validateLink={props.validationUrl}
                certificateElRef={ref}
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
                    props.isPreview && styles.asPreview,
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
                                                    content={`This member is compliant with Topcoder policies
                                                and is a trusted member of the Topcoder community.`}
                                                >
                                                    <IconOutline.InformationCircleIcon
                                                        className={styles.toolTipIcon}
                                                    />
                                                </Tooltip>
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
                                {renderTCACertificatePreview(certificateElRef)}

                                {!props.isModalView && (
                                    <div className={styles.certActionBtns}>
                                        <ActionButton
                                            icon={<IconOutline.ZoomInIcon />}
                                            className={classNames(styles.certZoomBtn, styles.certActionBtn)}
                                            onClick={handleShowCertPreviewModal}
                                        />
                                        {renderShareActions && (
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
                                )}
                            </div>
                            {renderShareActions && (
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

    useLayoutEffect(() => {
        const el: HTMLElement = wrapElRef.current
        if (!el || !props.isModalView) {
            return
        }

        hideSiblings(el.parentElement as HTMLElement)
        hideSiblings(el.parentElement?.parentElement as HTMLElement)

    })

    return !!props.certification && !!props.userProfile ? (
        <div className={props.isModalView ? styles.modalView : ''} ref={wrapElRef}>
            {renderHero()}

            <ContentLayout
                contentClass={styles.contentWrap}
                outerClass={styles.outerContentWrap}
                innerClass={styles.innerContentWrap}
            >
                <div className={styles.wrap}>
                    {renderShareActions && (
                        <Button
                            primary
                            icon={IconOutline.ShareIcon}
                            label='Share your Certification'
                            className={styles.shareBtn}
                            onClick={shareModal.show}
                            size='lg'
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
                                emsiSkills={props.certification?.emsiSkills ?? []}
                                theme='gray'
                                label=''
                                expandCount={props.certification?.skills?.length ?? 0}
                            />

                            {!props.isModalView && (
                                <LinkButton
                                    secondary
                                    label={(
                                        props.isOwner ? 'View your Topcoder profile' : 'View full Topcoder profile'
                                    )}
                                    size='lg'
                                    className={styles.shareBtn}
                                    to={props.isPreview ? '#profile-preview' : myProfileLink}
                                    target='_blank'
                                    rel='noreferrer'
                                />
                            )}
                        </div>
                    </div>

                    {renderCoursesGridItems()}

                    {!props.isModalView && (
                        <LinkButton
                            icon={IconOutline.ArrowRightIcon}
                            iconToRight
                            className={styles.detailsBtn}
                            link
                            label='Certification details'
                            size='xl'
                            to={certificationDetailsLink}
                        />
                    )}
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
