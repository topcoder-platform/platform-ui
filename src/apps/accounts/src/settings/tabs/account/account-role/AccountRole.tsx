import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal, Button, Collapsible } from '~/libs/ui'
import { authUrlLogout, updatePrimaryMemberRoleAsync, UserProfile } from '~/libs/core'
import { triggerSurvey } from '~/apps/accounts/src/lib'

import styles from './AccountRole.module.scss'

interface AccountRoleProps {
    profile: UserProfile
}
// TODO: move to libs/core after discussion
// we need to have uniq list of TC roles
enum AccountRoles {
    CUSTOMER = 'Topcoder Customer',
    TALENT = 'Topcoder Talent'
}

const AccountRole: FC<AccountRoleProps> = (props: AccountRoleProps) => {
    const [memberRole, setMemberRole]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(
            props.profile.roles.includes(AccountRoles.CUSTOMER) ? AccountRoles.CUSTOMER : AccountRoles.TALENT,
        )

    const [isUpdating, setIsUpdating]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [isRoleChangeConfirmed, setIsRoleChangeConfirmed]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleRoleChange(): void {
        const newRole: string = memberRole === AccountRoles.CUSTOMER ? AccountRoles.TALENT : AccountRoles.CUSTOMER

        if (!isUpdating) {
            setIsUpdating(true)
            updatePrimaryMemberRoleAsync(newRole)
                .then(() => {
                    setMemberRole(newRole)
                    setIsRoleChangeConfirmed(true)
                    triggerSurvey()
                })
                .finally(() => {
                    setIsUpdating(false)
                })
        }
    }

    function handleSignOut(): void {
        window.location.href = authUrlLogout
    }

    return (
        <Collapsible
            header={<h3>Account Role</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <p>
                Access to Topcoder tools and applications are based on your account role.
                If you change this setting, you will be required to sign out of your account and login.
            </p>

            <form>
                <div className={styles.formControlWrap}>
                    <label htmlFor='role-1'>Topcoder Talent</label>
                    <input
                        type='radio'
                        name='role'
                        id='role-1'
                        onChange={handleRoleChange}
                        checked={memberRole === AccountRoles.TALENT}
                    />
                </div>
                <div className={styles.formControlWrap}>
                    <label htmlFor='role-2'>Topcoder Customer</label>
                    <input
                        type='radio'
                        name='role'
                        id='role-2'
                        onChange={handleRoleChange}
                        checked={memberRole === AccountRoles.CUSTOMER}
                    />
                </div>
            </form>

            {
                isRoleChangeConfirmed && (
                    <BaseModal
                        title='Confirmed'
                        open
                        // eslint-disable-next-line react/jsx-no-bind, @typescript-eslint/no-empty-function
                        onClose={() => { }}
                        buttons={<Button primary onClick={handleSignOut}>Sign Out</Button>}
                    >
                        <p>
                            You have successfully changed your account role.
                            Please sign out of your account and login to complete this update.
                        </p>
                    </BaseModal>
                )
            }

        </Collapsible>
    )
}

export default AccountRole
