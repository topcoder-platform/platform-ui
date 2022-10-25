import cn from 'classnames'
import React, { FocusEvent, SVGProps } from 'react'

import { Button, HelpIcon, IconOutline, textFormatMoneyLocaleString, useCheckIsMobile, IconCheck } from '../../../../lib'
import { FormCard, FormInputModel } from '../../form-input.model'

import styles from './FormCardSet.module.scss'

interface FormCardSetProps extends FormInputModel {
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
}

const FormCardSet: React.FC<FormCardSetProps> = ({ name, cards, onChange, value }: FormCardSetProps) => {
    const isMobile: boolean = useCheckIsMobile()

    const iconFromName: (icon: string) => JSX.Element = (icon: string) => {
        if (!icon) {
            return <></>
        }

        const iconName: string = `${icon.split('-').map((chunk: string) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join('')}Icon`
        const IconComponent: React.FC<SVGProps<SVGSVGElement>> = IconOutline[iconName as keyof typeof IconOutline]
        return <IconComponent className={styles['card-row-icon']} />
    }

    const getButton: (card: FormCard, selected: boolean) => JSX.Element = (card, selected) => (
        <Button
            onClick={(evt) => {
                onChange(evt)
            }}
            label={selected ? 'Selected' : 'Choose package'}
            buttonStyle={selected ? 'primary' : 'secondary'}
            type={selected ? 'button' : 'submit'}
            size='sm'
            icon={selected ? IconCheck : undefined}
            id={card.id}
            name={name}
            className={selected ? 'flex-row' : ''}
        />
    )

    return (
        <div className={styles['form-card-set']}>
            {
                cards?.map((card, index: number) => {
                    const formattedPrice: string | undefined = textFormatMoneyLocaleString(card.price)
                    const selected: boolean = value === card.id
                    return (
                        <div key={`card-${index}`}className={cn(styles['card'], selected && styles['selected'],  isMobile && card.mostPopular && styles['mobile-popular'], { [styles.feature]: index === 0, [styles.mobile]: isMobile })}>
                            { card.mostPopular && <div className={styles['popular-card']}>MOST POPULAR</div>}
                            <div className={cn(styles['card-header'], isMobile && styles['mobile'], { [styles.feature]: index === 0 })}>
                                <div className='body-medium-bold'>{card.title}</div>
                                <h3>{formattedPrice}</h3>
                                {getButton(card, selected)}
                            </div>
                            {card.sections.map((section, sectionIndex: number) => (
                                <div key={`section-${sectionIndex}`} className={cn(styles['card-section'], { [styles.mobile]: isMobile, [styles.feature]: index === 0})}>
                                    {section.rows.map((row, rowIndex: number) => (
                                        <div className={styles['row']}>
                                            <div className={styles['row-divider']}></div>
                                            <div key={`row-${rowIndex}`} className={styles['card-row']}>
                                                { ((isMobile) || (index === 0)) && (
                                                    <span className={cn(styles['card-row-col'], styles['mobile'], styles['feature-name'])}>
                                                        {row.icon && iconFromName(row.icon)}
                                                        {row.label ?
                                                            <span className={cn('overline', styles.label)}>{row.label}</span> :
                                                            <span className='body-main'>{row.text}</span>
                                                        }
                                                        {row.infoIcon && (
                                                            <HelpIcon
                                                                inverted
                                                                arrowColor='#000000'
                                                                backgroundColor='#000000'
                                                                type='Info'
                                                            >
                                                                {row.tooltipText}
                                                            </HelpIcon>
                                                        )}
                                                    </span>
                                                )}
                                                {(
                                                    <span className={cn(styles['card-row-col'], styles['center'])}>
                                                        { row.valueIcon ?
                                                            <IconOutline.CheckIcon width={18} height={16} /> :
                                                            <span className='body-main'>{row.text}</span>
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )
                })
            }
        </div>
    )
}

export default FormCardSet
