/* eslint-disable complexity */
import {
    ChangeEvent,
    FC,
    FormEvent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { authUrlLogin, profileContext, ProfileContextData } from '~/libs/core'
import {
    Button,
    LinkButton,
    LoadingSpinner,
} from '~/libs/ui'

import {
    challengeDetailRouteId,
    challengeListingRouteId,
    rootRoute,
} from '../../config/routes.config'
import {
    hasOpenSubmissionPhase,
    useChallenge,
    useCommunityMeta,
    useSubmitChallenge,
} from '../../lib'
import type {
    BackendChallengePhase,
    ChallengeInfo,
    SubmitChallengeType,
    UseChallengeResult,
    UseCommunityMetaResult,
    UseSubmitChallengeResult,
} from '../../lib'

import {
    FilePicker,
    type FilestackData,
} from './components/FilePicker'
import { UploadingState } from './components/UploadingState'
import styles from './SubmissionPage.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function getPhaseName(phase: BackendChallengePhase): string {
    const extendedPhase = phase as BackendChallengePhase & { phaseType?: string }
    return (extendedPhase.phaseType || phase.name || '').toLowerCase()
}

function isCompleted(challenge: ChallengeInfo): boolean {
    return `${challenge.status}`.toLowerCase() === 'completed'
}

function isOpenPhase(
    phase: BackendChallengePhase | undefined,
): boolean {
    return phase?.isOpen === true
}

function getSubmissionType(
    phases: BackendChallengePhase[],
): SubmitChallengeType {
    const checkpointPhase = phases.find(phase => getPhaseName(phase) === 'checkpoint submission')
    const submissionPhase = phases.find(phase => getPhaseName(phase) === 'submission')
    const finalFixPhase = phases.find(phase => getPhaseName(phase) === 'final fix')

    if (isOpenPhase(checkpointPhase)) {
        return 'CHECKPOINT_SUBMISSION'
    }

    if (checkpointPhase && !isOpenPhase(checkpointPhase) && isOpenPhase(submissionPhase)) {
        return 'CONTEST_SUBMISSION'
    }

    if (isOpenPhase(finalFixPhase)) {
        return 'STUDIO_FINAL_FIX_SUBMISSION'
    }

    return 'CONTEST_SUBMISSION'
}

function getTopGearInstructionText(): JSX.Element {
    return (
        <>
            <p className={styles.subText}>Steps for Submission:</p>
            <ol className={styles.steps}>
                <li>Upload the challenge deliverable to the approved repository.</li>
                <li>Copy the deliverable URL and click &quot;SET URL&quot;.</li>
                <li>Check the agreement box.</li>
                <li>Click Submit.</li>
            </ol>
            <p className={styles.warning}>
                Ensure that the submitted link reflects the deliverable for this challenge only.
            </p>
        </>
    )
}

function getStandardInstructionText(trackName: string): JSX.Element {
    const normalizedTrack = trackName.toLowerCase()
    const isDesign = normalizedTrack.includes('design')
    const isEngineeringTrack = normalizedTrack.includes('development')
        || normalizedTrack.includes('data science')
        || normalizedTrack.includes('qa')

    return (
        <>
            <p>
                Please follow the instructions on the challenge details page for how your submission
                should be organized.
            </p>
            {isEngineeringTrack && (
                <p className={styles.subText}>
                    Upload your entire submission as a single .zip file.
                </p>
            )}
            {isDesign && (
                <ol className={styles.steps}>
                    <li>Place your files into a Submission.zip file.</li>
                    <li>Place source files into a Source.zip file.</li>
                    <li>Create a .jpg preview file.</li>
                    <li>Create Declaration.txt describing used assets/fonts/icons.</li>
                    <li>Zip these files into a single .zip and upload it.</li>
                </ol>
            )}
        </>
    )
}

/**
 * Challenge submission page.
 *
 * @returns Submission upload page content.
 */
const SubmissionPage: FC = () => {
    const { challengeId }: { challengeId?: string } = useParams<{ challengeId: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isLoggedIn, profile }: ProfileContextData = useContext(profileContext)

    const [selectedFile, setSelectedFile] = useState<FilestackData | undefined>(undefined)
    const [filePickerError, setFilePickerError] = useState<string>('')

    const communityId = searchParams.get('communityId') ?? undefined
    const {
        challenge,
        isLoading: isLoadingChallenge,
    }: UseChallengeResult = useChallenge(challengeId)
    const {
        communityMeta,
    }: UseCommunityMetaResult = useCommunityMeta(communityId)
    const {
        agreed,
        error,
        isSubmitting,
        reset,
        setAgreed,
        submit,
        submitDone,
        uploadProgress,
    }: UseSubmitChallengeResult = useSubmitChallenge()

    const queryString = searchParams.toString()
    const isTopGear = communityMeta?.mainSubdomain === 'topgear'
    const hasRegistered = challenge?.isRegistered === true

    const challengeDetailPath = useMemo(() => withLeadingSlash(
        `${rootRoute}/${generatePath(challengeDetailRouteId, {
            challengeId: challengeId ?? '',
        })}`,
    )
        .replace(/\/{2,}/g, '/'), [challengeId])
    const challengeDetailUrl = useMemo(() => (
        queryString
            ? `${challengeDetailPath}?${queryString}`
            : challengeDetailPath
    ), [challengeDetailPath, queryString])
    const challengesUrl = useMemo(() => withLeadingSlash(
        `${rootRoute}/${challengeListingRouteId}`,
    )
        .replace(/\/{2,}/g, '/'), [])
    const challengesListingUrl = useMemo(() => (
        queryString
            ? `${challengesUrl}?${queryString}`
            : challengesUrl
    ), [challengesUrl, queryString])

    const submissionType = useMemo<SubmitChallengeType>(() => {
        if (!challenge?.phases?.length) {
            return 'CONTEST_SUBMISSION'
        }

        return getSubmissionType(challenge.phases)
    }, [challenge?.phases])

    const submissionPermitted = useMemo(() => {
        if (!challenge) {
            return false
        }

        const submissionEnded = isCompleted(challenge) || !hasOpenSubmissionPhase(challenge.phases)
        const hasFirstPlacement = (challenge.winners || []).some(winner => (
            winner.placement === 1
            && !!winner.handle
            && winner.handle === profile?.handle
        ))
        const canSubmitFinalFixes = hasFirstPlacement && challenge.phases.some(phase => (
            getPhaseName(phase) === 'final fix'
            && phase.isOpen === true
        ))

        return !submissionEnded || canSubmitFinalFixes
    }, [challenge, profile?.handle])

    const submitDisabled = !agreed || !selectedFile?.filename || !!filePickerError
    const shouldRenderUploadingState = isSubmitting || submitDone || !!error

    useEffect(() => {
        if (!isLoggedIn) {
            window.location.assign(authUrlLogin(window.location.href))
        }
    }, [isLoggedIn])

    const resetSubmissionForm = useCallback((): void => {
        reset()
        setSelectedFile(undefined)
        setFilePickerError('')
    }, [reset])

    const submitSelectedFile = useCallback(async (): Promise<void> => {
        if (!challengeId || !profile?.userId || !selectedFile) {
            return
        }

        await submit({
            challengeId,
            fileType: selectedFile.fileType,
            memberId: `${profile.userId}`,
            type: submissionType,
            url: selectedFile.fileUrl,
        })
    }, [challengeId, profile?.userId, selectedFile, submit, submissionType])

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        await submitSelectedFile()
    }, [submitSelectedFile])
    const handleBackToChallenge = useCallback((): void => {
        navigate(challengeDetailUrl)
    }, [challengeDetailUrl, navigate])

    const handleFileSelected = useCallback((data: FilestackData): void => {
        setSelectedFile(data)
        setFilePickerError('')
    }, [])

    const handleFileError = useCallback((message: string): void => {
        setFilePickerError(message)
    }, [])

    const handleAgreeChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setAgreed(event.target.checked)
    }, [setAgreed])

    if (!isLoggedIn) {
        return <LoadingSpinner />
    }

    if (isLoadingChallenge || !challenge) {
        return (
            <div className={styles.spinnerWrap}>
                <LoadingSpinner />
            </div>
        )
    }

    if (!hasRegistered) {
        return (
            <section className={styles.page}>
                <div className={styles.header}>
                    <LinkButton label='Back to Challenge' secondary to={challengeDetailUrl} />
                </div>
                <div className={styles.accessDenied}>
                    <h2>Access Denied</h2>
                    <p>You must register for this challenge before submitting.</p>
                    <LinkButton label='Go to Challenge Details' primary to={challengeDetailUrl} />
                </div>
            </section>
        )
    }

    if (!submissionPermitted) {
        return (
            <section className={styles.page}>
                <div className={styles.header}>
                    <LinkButton label='Back to Challenge' secondary to={challengeDetailUrl} />
                </div>
                <div className={styles.notPermitted}>
                    <h2>Submissions are not permitted at this time.</h2>
                </div>
            </section>
        )
    }

    if (shouldRenderUploadingState) {
        return (
            <section className={styles.page}>
                <div className={styles.header}>
                    <LinkButton label='Back to Challenges' secondary to={challengesListingUrl} />
                </div>

                <UploadingState
                    challengeId={challenge.id}
                    challengeName={challenge.name}
                    challengesUrl={challengesListingUrl}
                    error={error}
                    isSubmitting={isSubmitting}
                    onBack={handleBackToChallenge}
                    onReset={resetSubmissionForm}
                    onRetry={submitSelectedFile}
                    submitDone={submitDone}
                    track={challenge.track.name}
                    uploadProgress={uploadProgress}
                />
            </section>
        )
    }

    return (
        <section className={styles.page}>
            <div className={styles.header}>
                <LinkButton label='Back to Challenge Details' secondary to={challengeDetailUrl} />
                <h1>{challenge.name}</h1>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.columns}>
                    <div className={styles.leftColumn}>
                        <h2>{isTopGear ? 'URL' : 'Submission Upload'}</h2>
                        <div className={styles.instructions}>
                            {isTopGear
                                ? getTopGearInstructionText()
                                : getStandardInstructionText(challenge.track.name)}
                        </div>
                    </div>

                    <div className={styles.rightColumn}>
                        <FilePicker
                            challengeId={challenge.id}
                            isTopGear={isTopGear}
                            onError={handleFileError}
                            onFileSelected={handleFileSelected}
                            userId={`${profile?.userId ?? ''}`}
                        />
                        {!!filePickerError && (
                            <p className={styles.errorText}>{filePickerError}</p>
                        )}
                    </div>
                </div>

                <div className={styles.terms}>
                    <p>
                        {isTopGear
                            ? (
                                <>
                                    Submitting your link means you agree to the
                                    {' '}
                                    <a
                                        href={EnvironmentConfig.NDA_TERMS_URL}
                                        rel='noreferrer noopener'
                                        target='_blank'
                                    >
                                        TopGear terms and conditions
                                    </a>
                                    .
                                </>
                            )
                            : (
                                <>
                                    Submitting your files means you agree to the
                                    {' '}
                                    <a
                                        href={EnvironmentConfig.TERMS_URL}
                                        rel='noreferrer noopener'
                                        target='_blank'
                                    >
                                        Topcoder terms of use
                                    </a>
                                    .
                                </>
                            )}
                    </p>

                    <label className={styles.agreeControl} htmlFor='submission-agree'>
                        <input
                            checked={agreed}
                            id='submission-agree'
                            onChange={handleAgreeChange}
                            type='checkbox'
                        />
                        <span>I understand and agree</span>
                    </label>
                </div>

                <div className={styles.submitRow}>
                    <Button disabled={submitDisabled} label='Submit' primary type='submit' />
                </div>
            </form>
        </section>
    )
}

export { SubmissionPage }
export default SubmissionPage
