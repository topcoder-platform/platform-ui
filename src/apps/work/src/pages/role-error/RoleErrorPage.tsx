import { FC } from 'react'

import { WORK_MANAGER_ALLOWED_ROLES } from '../../config/access.config'
import { ErrorMessage } from '../../lib/components'

const requiredRolesLabel = WORK_MANAGER_ALLOWED_ROLES.join(', ')
const roleErrorMessage = `You do not have permission to access the Work app. Required roles: ${requiredRolesLabel}.`

const RoleErrorPage: FC = () => (
    <ErrorMessage message={roleErrorMessage} />
)

export default RoleErrorPage
