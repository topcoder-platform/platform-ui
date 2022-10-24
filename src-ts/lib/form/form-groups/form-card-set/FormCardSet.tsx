import cn from 'classnames'
import React, { FocusEvent, SVGProps } from 'react'

import { ReactComponent as CheckIcon } from '../../../../../src/assets/images/icon-check-thin.svg'
import { Button, HelpIcon, IconOutline, textFormatMoneyLocaleString, useCheckIsMobile } from '../../../../lib'
import { FormInputModel } from '../../form-input.model'

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

    return (
        <div className={styles['form-card-set']}>
            {
                !isMobile &&
                <div className={cn(styles['card'], styles['feature'])}>
                    <div className={cn(styles['card-header'], styles['feature'])}>
                        <div className='body-medium-bold'>hidden text</div>
                        <h3>hidden text</h3>
                        <Button
                            label={'Hidden button'}
                            size='sm'
                        />
                    </div>
                    {cards && (cards[0] || []).sections.map((section, sectionIndex: number) => (
                        <div key={`section-${sectionIndex}`} className={cn(styles['card-section'], styles['feature'])}>
                            {section.rows.map((row, rowIndex: number) => (
                                <>
                                    <div className={styles['row-divider']}></div>
                                    <div key={`row-${rowIndex}`} className={styles['card-row']}>
                                        {row.icon && iconFromName(row.icon)}
                                        {row.label && (
                                            <div className={cn(styles['card-row-col'], { [styles['info-col']]: row.infoIcon })}>
                                                <span className='overline'>{row.label}</span>
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
                                            </div>
                                        )}
                                    </div>
                                </>
                            ))}
                        </div>
                    ))}
                </div>
            }

            {
                cards?.map((card, index: number) => {
                    const formattedPrice: string | undefined = textFormatMoneyLocaleString(card.price)
                    const selected: boolean = value === card.id

                    return (
                        <div key={`card-${index}`}className={cn(styles['card'], selected && styles['selected'], isMobile && card.mostPopular && styles['mobile-popular'])}>

                            { card.mostPopular && <div className={styles['popular-card']}>MOST POPULAR</div>}
                            <div className={cn(styles['card-header'], isMobile && styles['mobile'])}>
                                <div className='body-medium-bold'>{card.title}</div>
                                <h3>{formattedPrice}</h3>
                                <Button
                                    onClick={(evt) => {
                                        onChange(evt)
                                    }}
                                    label={selected ? 'Selected' : 'Choose package'}
                                    buttonStyle={selected ? 'primary' : 'secondary'}
                                    type={selected ? 'button' : 'submit'}
                                    size='sm'
                                    icon={selected ? CheckIcon : undefined}
                                    id={card.id}
                                    name={name}
                                    value={card.id}
                                    className={selected ? 'flex-row' : ''}
                                />
                            </div>
                            {card.sections.map((section, sectionIndex: number) => (
                                <div key={`section-${sectionIndex}`} className={cn(styles['card-section'], { [styles.mobile]: isMobile })}>
                                    {section.rows.map((row, rowIndex: number) => (
                                        <div className={styles['row']}>
                                            <div className={styles['row-divider']}></div>
                                            <div key={`row-${rowIndex}`} className={styles['card-row']}>
                                                {isMobile && (
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
                                                {row.label && (
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
