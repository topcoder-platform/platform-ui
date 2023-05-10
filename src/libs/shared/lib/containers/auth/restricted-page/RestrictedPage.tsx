/* eslint-disable jsx-a11y/anchor-is-valid */
import { Dispatch, FC, MouseEvent, SetStateAction, useState } from 'react'

import { ContentLayout } from '~/libs/ui'

import { ContactSupportModal } from '../../../components'

import styles from './RestrictedPage.module.scss'

export const RestrictedPage: FC<{}> = () => {
    const [showSupportModal, setShowSupportModal]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    function openSupportModal(e: MouseEvent<HTMLAnchorElement>): void {
        e.preventDefault()
        setShowSupportModal(true)
    }

    function closeSupportModal(): void {
        setShowSupportModal(false)
    }

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
            title='Thanks for visiting'
        >
            <div className={styles.container}>
                <p>
                    Unfortunately, you are not permitted to access the site. If you feel you should be able to, please
                    {' '}
                    <a
                        href='#support'
                        onClick={openSupportModal}
                    >
                        contact us
                    </a>
                    .
                </p>
            </div>

            <ContactSupportModal
                isOpen={showSupportModal}
                onClose={closeSupportModal}
            />
        </ContentLayout>
    )
}
