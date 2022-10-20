import { Button, ButtonProps, useCheckIsMobile } from '../../../../../../../lib'
import { MemberBadgeAward } from '../../../../../game-lib'

import styles from './MemberActionRenderer.module.scss'

function MemberActionRenderer(memberAward: MemberBadgeAward): JSX.Element {

    const isMobile: boolean = useCheckIsMobile()

    const buttonProps: ButtonProps = {
        buttonStyle: 'secondary',
        size: isMobile ? 'xs' : 'sm',
    }

    const actionButtons: Array<{
        label: string
    }> = [
            {
                label: 'Unassign',
            },
        ]

    function onUnassign(): void {
        // TODO: unassign feature
    }

    return (
        <div className={styles['badge-actions']}>
            {actionButtons.map((button, index) => {
                return (
                    <Button
                        {...buttonProps}
                        key={index}
                        label={button.label}
                        onClick={onUnassign}
                    />
                )
            })}
        </div>
    )
}

export default MemberActionRenderer
