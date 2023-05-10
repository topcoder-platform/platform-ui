import { FC } from 'react'
import classNames from 'classnames'

import { IconSolid } from '~/libs/ui'

import styles from './CertificateNotFoundContent.module.scss'

interface CertificateNotFoundContentProps {
    className?: string
}

const CertificateNotFoundContent: FC<CertificateNotFoundContentProps> = (props: CertificateNotFoundContentProps) => (
    <div className={classNames(styles.content, 'body-main', props.className)}>
        <p>
            Hey there!
        </p>
        <p>
            Looks like we don’t have your certificate.
            Have you completed the course? If not, keep going at it! If you have:
        </p>
        <ol>
            <li>
                Try again in 60 seconds. We might still be generating your certification!
            </li>
            <li>
                If you already waited, contact our support team.
                Please reference Topcoder Academy and the course you completed.

                <a href='mailto:support@topcoder.com'>
                    Contact support
                    <IconSolid.ArrowRightIcon />
                </a>
            </li>
        </ol>
        <p>
            Keep Learning away!
        </p>
    </div>
)

export default CertificateNotFoundContent
