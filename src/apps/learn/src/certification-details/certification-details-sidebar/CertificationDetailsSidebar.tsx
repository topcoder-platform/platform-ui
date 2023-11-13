import { Dispatch, FC, ReactNode, SetStateAction, useMemo, useState } from 'react'
import { KeyedMutator } from 'swr'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { IconOutline, IconSolid, Tooltip } from '~/libs/ui'
import { UserProfile, UserRole } from '~/libs/core'

import {
    CompletionTimeRange,
    EditSkillsBtn,
    LearnLevelIcon,
    ModifySkillsModal,
    ProvidersLogoList,
    SkillTags,
    StickySidebar,
    StripeProduct,
    TCACertificatePreview,
    TCACertification,
    TCACertificationProgress,
    useGetStripeProduct,
} from '../../lib'
import { EnrollCtaBtn } from '../enroll-cta-btn'

import styles from './CertificationDetailsSidebar.module.scss'

interface CertificationDetailsSidebarProps {
    certification: TCACertification
    enrolled: boolean
    certProgress?: TCACertificationProgress
    profile: UserProfile | undefined
    reloadCertification: KeyedMutator<any>
}

function renderTooltipContents(icon: ReactNode, text: Array<string>): ReactNode {
    return (
        <div className={styles.tooltip}>
            {icon}
            <span
                className='body-small'
                dangerouslySetInnerHTML={{ __html: text.join('<br />') }}
            />
        </div>
    )
}

// eslint-disable-next-line complexity
const CertificationDetailsSidebar: FC<CertificationDetailsSidebarProps> = (props: CertificationDetailsSidebarProps) => {
    const completed: boolean = !!props.certProgress?.completedAt

    const tcaMonetizationEnabled: boolean = EnvironmentConfig.ENABLE_TCA_CERT_MONETIZATION || false

    // fetch Stripe product data conditionally
    const { product }: { product: StripeProduct | undefined }
        = useGetStripeProduct(
            tcaMonetizationEnabled && !completed && !props.certProgress
                ? props.certification?.stripeProductId as string
                : '',
        )
    const price: string
        = Number((product?.default_price.unit_amount || 0) / 100)
            .toFixed(2)

    const suggestedRetailPrice: string = product?.metadata?.estimatedRetailPrice || '20'

    const canEdit: boolean = useMemo(() => !!props.profile?.roles?.includes(UserRole.tcaAdmin), [props.profile])

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleModyfSkillsModalClose(): void {
        setIsEditMode(false)
    }

    function handleModyfSkillsSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.reloadCertification()
        }, 1500)
    }

    function handleEditSkillsClick(): void {
        setIsEditMode(true)
    }

    return (
        <StickySidebar>
            <div className={styles['certificate-placeholder']}>
                <TCACertificatePreview
                    certification={props.certification}
                    userName={props.certProgress?.userName}
                    tcHandle={props.certProgress?.userHandle}
                    completedDate={props.certProgress?.completedAt as unknown as string ?? ''}
                />
            </div>
            <ul className={styles['certification-details-list']}>
                <li>
                    <span className={styles.icon}>
                        <LearnLevelIcon level={props.certification.learnerLevel} />
                    </span>
                    <span className='quote-main'>{props.certification.learnerLevel}</span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.DocumentTextIcon />
                    </span>
                    <span className='quote-main'>
                        {props.certification.coursesCount}
                        {' courses'}
                    </span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.ClockIcon />
                    </span>
                    <span className='quote-main'>
                        <CompletionTimeRange range={props.certification.completionTimeRange} />
                        <Tooltip
                            content={renderTooltipContents(<IconSolid.ClockIcon />, [
                                'Assuming 1 to 4 hour',
                                'learning per day',
                            ])}
                            place='bottom'
                        >
                            <IconOutline.InformationCircleIcon className='tooltip-icon' />
                        </Tooltip>
                    </span>
                </li>
                {!props.certProgress && (
                    <li>
                        <span className={styles.icon}>
                            <IconSolid.CurrencyDollarIcon />
                        </span>
                        <span className='quote-main'>
                            <span className='strike'>
                                $
                                {suggestedRetailPrice}
                                &nbsp;
                            </span>
                            {tcaMonetizationEnabled ? (
                                <>
                                    <span>
                                        $
                                        {price}
                                        &nbsp;
                                    </span>
                                    <span>one-time payment</span>
                                    <Tooltip
                                        content={renderTooltipContents(<IconSolid.CurrencyDollarIcon />, [
                                            'One-off, non-recurring payment',
                                        ])}
                                        place='bottom'
                                    >
                                        <IconOutline.InformationCircleIcon className='tooltip-icon' />
                                    </Tooltip>
                                </>
                            ) : (
                                <>
                                    <strong className={styles.freeLabel}>FREE</strong>
                                    <span className='body-main-bold'>&nbsp;enrollment for a limited time</span>
                                </>
                            )}
                        </span>
                    </li>
                )}
            </ul>

            <div className={classNames('body-small-medium', styles['section-header'])}>
                <span>Skills Covered</span>
                {
                    canEdit && (
                        <EditSkillsBtn
                            onClick={handleEditSkillsClick}
                            className={styles.editTCABtn}
                        />
                    )
                }
            </div>
            <SkillTags
                skills={props.certification.skills}
                courseKey={props.certification.dashedName}
                theme='gray'
                expandCount={9}
            />

            <ProvidersLogoList
                label='Content from'
                className={styles.providers}
                providers={props.certification.providers}
            />

            <div className={styles.btns}>
                {(props.enrolled || completed) ? (
                    <div className={classNames(
                        styles.tag,
                        completed
                            ? styles[
                                `completed-${props.certification.certificationCategory.track.toLowerCase() || 'dev'}`
                            ]
                            : styles.enrolled,
                    )}
                    >
                        <span className='body-main-medium'>{completed ? 'Completed' : 'Enrolled'}</span>
                    </div>
                ) : (
                    <EnrollCtaBtn certification={props.certification.dashedName} />
                )}
            </div>

            {
                isEditMode && (
                    <ModifySkillsModal
                        onClose={handleModyfSkillsModalClose}
                        onSave={handleModyfSkillsSave}
                        certification={props.certification}
                    />
                )
            }
        </StickySidebar>
    )
}

export default CertificationDetailsSidebar
