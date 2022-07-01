import { FC, useContext, useEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'
import { getCoursePath } from '..'

import { IconOutline, LoadingSpinner, profileContext, ProfileContextData } from '../../../lib'
import {
    CoursesProviderData,
    MyCertificationProgressProviderData,
    MyCertificationProgressStatus,
    useCoursesProvider,
    useMyCertificationProgress,
} from '../learn-lib'

import { ActionButton } from './action-button'
import { Certificate } from './certificate'
import styles from './MyCertificate.module.scss'

interface MyCertificateProps {
}

const MyCertificate: FC<MyCertificateProps> = (props: MyCertificateProps) => {
    
    const { profile }: ProfileContextData = useContext(profileContext)
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''
    const coursePath = getCoursePath(providerParam, certificationParam)

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useCoursesProvider(providerParam, certificationParam)

    const {
        certificateProgress,
        ready: progressReady,
    }: MyCertificationProgressProviderData = useMyCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification
    )

    const ready: boolean = courseReady && progressReady

    function handleBackBtnClick(): void {
        navigate(-1)
    }

    useEffect(() => {
        if (ready && certificateProgress?.status !== MyCertificationProgressStatus.completed) {
          navigate(coursePath)
        }
      }, [ready, certificateProgress, coursePath])
  
    return (
        <>
            {!ready && <LoadingSpinner />}

            {ready && (
                <div className={styles['wrap']}>
                    <div className={styles['content-wrap']}>
                        <div className={styles['btns-wrap']}>
                            <ActionButton
                                icon={<IconOutline.ChevronLeftIcon />}
                                onClick={handleBackBtnClick}
                            />
                        </div>
                        <div className={styles['certificate-wrap']}>
                            <Certificate
                                course={course?.title}
                                userName={[profile?.firstName, profile?.lastName].filter(Boolean).join(' ')}
                                tcHandle={profile?.handle}
                                provider={course?.provider}
                                completedDate={certificateProgress?.completedDate ?? ''}
                            />
                        </div>
                        <div className={styles['btns-wrap']}>
                            <ActionButton icon={<IconOutline.PrinterIcon />} />
                            <ActionButton icon={<IconOutline.DownloadIcon />} />
                            <ActionButton icon={<IconOutline.ShareIcon />} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MyCertificate
