import { Dispatch, FC, SetStateAction, useState } from 'react'

import { OrderContractModal, PrivacyPolicyModal, TermsModal } from '../../../../lib'

import styles from './WorkDetailDetailsSidebar.module.scss'

const WorkDetailDetailsSidebar: FC<{}> = () => {

    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isTermsModalOpne, setIsTermsModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    return (
        <>
            <OrderContractModal isOpen={isOrderContractModalOpen} onClose={() => setIsOrderContractModalOpen(false)} />
            <PrivacyPolicyModal isOpen={isPrivacyPolicyModalOpen} onClose={() => setIsPrivacyPolicyModalOpen(false)} />
            <TermsModal isOpen={isTermsModalOpne} onClose={() => setIsTermsModalOpen(false)} />

            <div className={styles['wrap']}>
                <h4>supporting information</h4>
                <a
                    className={styles['link']}
                    role='button'
                    tabIndex={0}
                    onClick={() => setIsOrderContractModalOpen(true)}
                    rel='noopener noreferrer'
                >
                    ORDER CONTRACT
                </a>
                <a
                    className={styles['link']}
                    role='button'
                    tabIndex={0}
                    onClick={() => setIsPrivacyPolicyModalOpen(true)}
                    rel='noopener noreferrer'
                >
                    PRIVACY POLICY
                </a>
                <a
                    className={styles['link']}
                    role='button'
                    tabIndex={0}
                    onClick={() => setIsTermsModalOpen(true)}
                    rel='noopener noreferrer'
                >
                    TERMS
                </a>
            </div>
        </>
    )
}

export default WorkDetailDetailsSidebar
