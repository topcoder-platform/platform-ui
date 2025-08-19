/**
 * Content of registration tab.
 */
import { FC, useContext } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'

import { ChallengeDetailContextModel } from '../../models'
import { TableRegistration } from '../TableRegistration'
import { TableNoRecord } from '../TableNoRecord'
import { ChallengeDetailContext } from '../../contexts'

export const TabContentRegistration: FC = () => {
    // get challenge info from challenge detail context
    const {
        isLoadingChallengeResources,
        registrants,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    // show loading ui when fetching registrants
    if (isLoadingChallengeResources) {
        return <TableLoading />
    }

    // show no record message
    if (!registrants.length) {
        return <TableNoRecord />
    }

    // show registrants table
    return <TableRegistration datas={registrants} />
}

export default TabContentRegistration
