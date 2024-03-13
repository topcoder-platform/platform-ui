import React, { SVGProps } from 'react'

import { LinkButton } from '~/libs/ui'

interface ActionBarItemProps {
    containerClassName: string;
    action: {
        text: string;
        className: string;
        icon: React.FC<SVGProps<SVGSVGElement>>;
        isButtonDisabled?: boolean;
    };
    info: {
        text: string;
        icon: React.FC<SVGProps<SVGSVGElement>>;
        className: string;
    },
    onConfirm?: () => void;
}

const ActionBarItem: React.FC<ActionBarItemProps> = (props: ActionBarItemProps) => {
    const handleActionClick = React.useCallback(() => {
        props.onConfirm?.()
    }, [props])

    return (
        <div className={props.containerClassName}>
            <LinkButton
                className={props.info.className}
                label={props.info.text}
                iconToRight
                icon={props.info.icon}
                size='md'
                variant='danger'
                light={false}
                link
                disabled
            />
            <LinkButton
                className={props.action.className}
                label={props.action.text}
                icon={props.action.icon}
                iconToRight
                size='md'
                variant='linkblue'
                light={false}
                disabled={props.action.isButtonDisabled}
                onClick={handleActionClick}
                link
            />
        </div>
    )

}

export default ActionBarItem
