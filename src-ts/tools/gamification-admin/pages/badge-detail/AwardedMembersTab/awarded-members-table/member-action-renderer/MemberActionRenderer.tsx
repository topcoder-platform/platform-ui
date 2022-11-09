/* eslint-disable arrow-body-style */
// TODO: enable when unassign feature is ready
// import { Button, ButtonProps, useCheckIsMobile } from '../../../../../../../lib'
import { MemberBadgeAward } from '../../../../../game-lib'

import styles from './MemberActionRenderer.module.scss'

const MemberActionRenderer: (memberAward: MemberBadgeAward) => JSX.Element
    = (memberAward: MemberBadgeAward): JSX.Element => {

        // const isMobile: boolean = useCheckIsMobile()

        // const buttonProps: ButtonProps = {
        //     buttonStyle: 'secondary',
        //     size: isMobile ? 'xs' : 'sm',
        // }

        // const actionButtons: Array<{
        //     label: string
        // }> = [
        //         {
        //             label: 'Unassign',
        //         },
        //     ]

        // function onUnassign(): void {

        // }

        return (
            <div className={styles['badge-actions']}>
                {/* {actionButtons.map((button, index) => {
                return (
                    <Button
                        {...buttonProps}
                        key={index}
                        label={button.label}
                        onClick={onUnassign}
                    />
                )
            })} */}
            </div>
        )
    }

export default MemberActionRenderer
