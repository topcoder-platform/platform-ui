/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * FieldAvatar
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import React, { FC } from 'react'
import classNames from 'classnames'

import styles from './styles.module.scss'
import { Button, IconOutline } from '~/libs/ui'

interface FieldAvatarProps {
    className?: string
}

const FieldAvatar: FC<FieldAvatarProps> = ({
    className,
    ...props
}: FieldAvatarProps) => {
    return (
        <div
            className={classNames(styles.container, className, 'd-flex flex-column gap-20 align-items-start')}
        >
            <h3>A picture can speek a thousand words</h3>
            <div className='d-flex'>
                <div className='d-flex'>
                    <img src="" alt="" />
                </div>
                <div className='d-flex flex-column'>
                    <strong>Requirements:</strong>
                    <ul>
                        <li>PNG or JPG format.</li>
                        <li>Maximum size: 2MB.</li>
                    </ul>
                </div>
            </div>
            <Button
                size='lg'
                secondary
                iconToRight
                icon={IconOutline.DownloadIcon}
            >
                upload photo
            </Button>

        </div>
    )
}

export default FieldAvatar
