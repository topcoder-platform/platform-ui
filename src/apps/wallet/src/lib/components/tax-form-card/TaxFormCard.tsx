import React from 'react'

import { Button, PageDivider } from '~/libs/ui'

import styles from './TaxFormCard.module.scss'

interface TaxFormCardProps {
    formTitle: string
    formDescription: string
    reasonTitle: string
    reasonDescription: string
    instructionsLink: string
    instructionsLabel: string
    completionLabel: string
    additionalInfo?: {
        link?: {
            text: string
            href: string
        }
        purpose?: {
            title: string
            points: string[]
        }
        note?: string
    }
    icon: React.ReactNode
    onSetupClick: () => void
}

const TaxFormCard: React.FC<TaxFormCardProps> = (props: TaxFormCardProps) => (
    <div className={styles.card}>
        <div className={styles.header}>
            <div className={styles.icon}>{props.icon}</div>
            <h3 className='body-main'>{props.formTitle}</h3>
        </div>

        <PageDivider smMargins />

        <div className={styles.content}>
            <div className='body-main'>{props.formDescription}</div>

            <h4>{props.reasonTitle}</h4>
            <div className='body-main'>{props.reasonDescription}</div>

            {props.additionalInfo?.link && (
                <div className={styles.additionalInfoLink}>
                    <a href={props.additionalInfo.link.href}>{props.additionalInfo.link.text}</a>
                </div>
            )}

            {props.additionalInfo?.purpose && (
                <div className={styles.additionalInfoPurpose}>
                    <h4>{props.additionalInfo.purpose.title}</h4>
                    <ul>
                        {props.additionalInfo.purpose.points.map((point: string) => (
                            <li>{point}</li>
                        ))}
                    </ul>
                </div>
            )}

            {props.additionalInfo?.note && (
                <div className={styles.additionalInfoNote}>
                    <div className={`${styles.additionalInfoNoteText} body-main`}>{props.additionalInfo.note}</div>
                </div>
            )}
        </div>

        <div className={styles.footer}>
            <Button
                secondary
                label={props.instructionsLabel}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => {
                    window.location.href = props.instructionsLink
                }}
            />
            <Button primary label={props.completionLabel} onClick={props.onSetupClick} />
        </div>
    </div>
)

export default TaxFormCard
