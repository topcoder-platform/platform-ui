import React from 'react'

import { Form, IconOutline } from '../../../../../lib'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'

const BugHuntIntakeForm: React.FC = () => {

    const requestGenerator: () => void = () => {}

    const onSave: (val: any) => Promise<void> = (val: any) => new Promise(() => {}).then(() => {})

    // TODO - Put icon in WorkServicePrice

    return (
        <>
            <WorkTypeBanner
                title={bugHuntConfig.title}
                subTitle={bugHuntConfig.subtitle}
                workType={bugHuntConfig.type}
            />
            <WorkServicePrice
                duration={bugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={1599} // TODO in PROD-2446 - Budget/Pricing. Matching Figma mockup until then.
                serviceType={bugHuntConfig.type}
                showIcon
            />
            <div className={styles['bug-hunt-wrapper']}>
                <Form formDef={BugHuntFormConfig} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>

    )
}

export default BugHuntIntakeForm
