/**
 * Content of registration tab.
 */
import { FC, useContext } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { UserRole } from '~/libs/core'

import { ChallengeDetailContextModel, ReviewAppContextModel } from '../../models'
import { TableRegistration } from '../TableRegistration'
import { TableNoRecord } from '../TableNoRecord'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'

export const TabContentRegistration: FC = () => {
    // get challenge info from challenge detail context
    const {
        isLoadingChallengeResources,
        myRoles,
        registrants,
        resources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const hasCopilotRole = (myRoles ?? [])
        .some(role => {
            const normalizedRole = role
                ?.toLowerCase()
                .replace(/[^a-z]/g, '')

            return normalizedRole?.includes('copilot') ?? false
        })

    const isAdmin = loginUserInfo?.roles?.some(
        role => typeof role === 'string'
            && role.toLowerCase() === UserRole.administrator,
    ) ?? false

    const registrationData = hasCopilotRole || isAdmin ? resources : registrants

    // show loading ui when fetching registrants
    if (isLoadingChallengeResources) {
        return <TableLoading />
    }

    // show no record message
    if (!registrationData.length) {
        return <TableNoRecord message='No members registered' />
    }

    // show registrants table
    return <TableRegistration datas={registrationData} />
}

export default TabContentRegistration
