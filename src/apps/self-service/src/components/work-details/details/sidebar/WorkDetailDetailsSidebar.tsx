import { Dispatch, FC, MouseEvent, SetStateAction, useState } from 'react'

import { OrderContractModal, PrivacyPolicyModal, TermsModal } from '~/libs/ui'

import styles from './WorkDetailDetailsSidebar.module.scss'

const WorkDetailDetailsSidebar: FC<{}> = () => {

    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isTermsModalOpne, setIsTermsModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    // TODO: update the Button component so it can handle links that don't have arrows
    function getClickHandler(setter: Dispatch<SetStateAction<boolean>>): (event: MouseEvent) => void {
        return (event: MouseEvent): void => {
            event.preventDefault()
            setter(true)
        }
    }

    return (
        <>
            <OrderContractModal
                isOpen={isOrderContractModalOpen}
                onClose={function handleOrderClose() { setIsOrderContractModalOpen(false) }}
            />
            <PrivacyPolicyModal
                isOpen={isPrivacyPolicyModalOpen}
                onClose={function handlePPClose() { setIsPrivacyPolicyModalOpen(false) }}
            />
            <TermsModal
                isOpen={isTermsModalOpne}
                onClose={function handleTermsClose() { setIsTermsModalOpen(false) }}
            />

            <div className={styles.wrap}>
                <h4>supporting information</h4>
                <a
                    className={styles.link}
                    href={window.location.href}
                    onClick={getClickHandler(setIsOrderContractModalOpen)}
                    rel='noopener noreferrer'
                    role='button'
                    tabIndex={0}
                >
                    ORDER CONTRACT
                </a>
                <a
                    className={styles.link}
                    href={window.location.href}
                    onClick={getClickHandler(setIsPrivacyPolicyModalOpen)}
                    rel='noopener noreferrer'
                    role='button'
                    tabIndex={0}
                >
                    PRIVACY POLICY
                </a>
                <a
                    className={styles.link}
                    href={window.location.href}
                    onClick={getClickHandler(setIsTermsModalOpen)}
                    rel='noopener noreferrer'
                    role='button'
                    tabIndex={0}
                >
                    TERMS
                </a>
            </div>
        </>
    )
}

export default WorkDetailDetailsSidebar
