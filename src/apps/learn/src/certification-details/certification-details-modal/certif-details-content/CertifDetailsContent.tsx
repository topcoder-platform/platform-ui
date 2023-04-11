import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { PerksSection } from '../../perks-section'
import { Accordion } from '../../accordion'
import { TCACertification } from '../../../lib'

import { FAQs, perks } from './data'
import styles from './CertifDetailsContent.module.scss'

function renderBasicList(items: Array<string>): ReactNode {
    return (
        <ul className='body-main'>
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    )
}

interface CertifDetailsContentProps {
    certification?: TCACertification
    children?: ReactNode
    sectionClassName?: string
}

const CertifDetailsContent: FC<CertifDetailsContentProps> = (props: CertifDetailsContentProps) => {
    const sectionClassName: string = classNames(props.sectionClassName, styles['text-section'])

    function renderLearningOutcomeSection(): ReactNode {
        return (
            <div className={sectionClassName}>
                <h2>What I Will Learn?</h2>
                {renderBasicList(props.certification?.learningOutcomes ?? [])}
            </div>
        )
    }

    function renderRequirementsSection(): ReactNode {
        return (
            <div className={sectionClassName}>
                <h2>Prerequisites</h2>
                {props.certification?.prerequisites?.length ? (
                    renderBasicList(props.certification.prerequisites)
                ) : (
                    <p className='body-main'>
                        No prior knowledge in software development is required
                    </p>
                )}
            </div>
        )
    }

    function renderFaqSection(): ReactNode {
        return (
            <div className={sectionClassName}>
                <h2>Frequently Asked Questions</h2>
                <Accordion items={FAQs} />
            </div>
        )
    }

    return (
        <>
            <PerksSection items={perks} />
            {renderLearningOutcomeSection()}
            {props.children}
            {renderRequirementsSection()}
            {renderFaqSection()}
        </>
    )
}

export default CertifDetailsContent
