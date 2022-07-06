import { Dispatch, FC, MouseEvent, SetStateAction, useState } from 'react'

import { ContactSupportModal, OrderContractModal, PrivacyPolicyModal, TermsModal } from '../modals'
import { ProfileProvider } from '../profile-provider'
import { Facebook, Instagram, LinkedIn, Twitter, Youtube } from '../social-links'

import styles from './PageFooter.module.scss'

const PageFooter: FC<{}> = () => {

    const [isContactSupportModalOpen, setIsContactSupportModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isPrivacyModalOpen, setIsPrivacyModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isTermsModalOpen, setIsTermsModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    function handleClick(event: MouseEvent<HTMLAnchorElement>, setter: Dispatch<SetStateAction<boolean>>): void {
        event.preventDefault()
        setter(true)
    }

    return (
        <div className={styles['footer-wrap']}>

            <ProfileProvider>
                <ContactSupportModal
                    isOpen={isContactSupportModalOpen}
                    onClose={() => setIsContactSupportModalOpen(false)}
                />
            </ProfileProvider>

            <OrderContractModal
                isOpen={isOrderContractModalOpen}
                onClose={() => setIsOrderContractModalOpen(false)}
            />

            <PrivacyPolicyModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
            />

            <TermsModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
            />

            <div className={styles['footer-inner']}>
                <div className={styles.utils}>
                    <div>
                        <span>© {(new Date()).getFullYear()} Topcoder</span>
                        <a
                            href='#'
                            onClick={(e) => handleClick(e, setIsContactSupportModalOpen)}>
                            Support
                        </a>
                        {/* TODO: add Report a bug functionality to send to zendesk
                        https://topcoder.atlassian.net/browse/PROD-1864
                        <a href='#'>See a Bug?</a> */}
                    </div>
                    <div>
                        <a
                            href='#'
                            onClick={(e) => handleClick(e, setIsTermsModalOpen)}>
                            Terms
                        </a>
                        <a
                            href='#'
                            onClick={(e) => handleClick(e, setIsPrivacyModalOpen)}>
                            Privacy Policy
                        </a>
                    </div>
                </div>
                <div className={styles.social}>
                    <Facebook />
                    <Youtube />
                    <LinkedIn />
                    <Twitter />
                    <Instagram />
                </div>
            </div>
        </div>
    )
}

export default PageFooter
