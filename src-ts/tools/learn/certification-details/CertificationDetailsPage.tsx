import { FC, useContext } from 'react'
import { Params, useParams } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItemModel, ContentLayout, LoadingSpinner, profileContext, ProfileContextData, textFormatGetSafeString } from '../../../lib'
import { useLearnBreadcrumb } from '../learn-lib'

import styles from './CertificationDetailsPage.module.scss'

const CertificationDetailsPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { certification }: Params<string> = routeParams
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const ready: boolean = profileReady

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(certification),
            url: '',
        },
    ])

    return (
        <ContentLayout>
            {!ready && (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumb} />
        </ContentLayout>
    )
}

export default CertificationDetailsPage
