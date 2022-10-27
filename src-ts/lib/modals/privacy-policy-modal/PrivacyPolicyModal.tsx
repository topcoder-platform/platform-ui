import { Dispatch, FC, MouseEvent, MutableRefObject, SetStateAction, useEffect, useState, useRef } from 'react'

import { ProfileProvider } from '../../profile-provider'
import { BaseModal } from '../base-modal'
import { ContactSupportModal } from '../contact-support-modal'

import contentUrl from './privacy-policy.content.txt'
import styles from './PrivacyPolicyModal.module.scss'

interface PrivacyPolicyModalProps {
    isOpen: boolean
    onClose: () => void
}

const PrivacyPolicyModal: FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {

    const [isSupportOpen, setIsSupportOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    function openSupportModal(): void {
        setIsSupportOpen(true)
    }

    useEffect(() => {
      document.addEventListener('open:support', openSupportModal);
      return () => document.removeEventListener('open:support', openSupportModal);
    }, []);

    return (
        <>
            <ProfileProvider>
                <ContactSupportModal
                    isOpen={isSupportOpen}
                    onClose={() => setIsSupportOpen(false)}
                />
            </ProfileProvider>

            <BaseModal
                focusTrapped={false}
                onClose={onClose}
                open={isOpen && !isSupportOpen}
                size='lg'
                title='PRIVACY POLICY'
                contentClassName={styles.container}
                contentUrl={contentUrl}
            />
        </>
    )
}

export default PrivacyPolicyModal
