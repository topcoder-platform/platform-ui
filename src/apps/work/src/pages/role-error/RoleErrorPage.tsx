import { FC } from 'react'

import { ErrorMessage } from '../../lib/components'

const RoleErrorPage: FC = () => (
    <ErrorMessage message='You do not have permission to access the Topcoder Work app.' />
)

export default RoleErrorPage
