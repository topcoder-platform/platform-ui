import cn from 'classnames'
import React, { FocusEvent, SVGProps } from 'react'

import { IconOutline, textFormatMoneyLocaleString } from '../../../../lib'
import { FormInputModel } from '../../form-input.model'

import styles from './FormCardSet.module.scss'

interface FormCardSetProps extends FormInputModel {
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
}

const FormCardSet: React.FC<FormCardSetProps> = ({ name, cards, onChange, value }: FormCardSetProps) => {

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
                cards?.map((card, index: number) => {
                    const formattedPrice: string | undefined = textFormatMoneyLocaleString(card.price)
                    const selected: boolean = value === card.id

                    return (
                        <label key={`card-${index}`}className={cn(styles['card'], selected && styles['selected'])}>
                            <input checked={value === card.id} type='radio' name={name} id={card.id} value={card.id} onChange={onChange} />
                            <div className={styles['card-header']}>
                                <div className='body-medium-bold'>{card.title}</div>
                                <h3>{formattedPrice}</h3>
                            </div>
                            <hr />
                            {card.sections.map((section, sectionIndex: number) => (
                                <div key={`section-${sectionIndex}`} className={styles['card-section']}>
                                    {section.rows.map((row, rowIndex: number) => (
                                            <div key={`row-${rowIndex}`} className={styles['card-row']}>
                                                <span className={styles['card-row-col']}>
                                                    <>
                                                        {row.icon && iconFromName(row.icon)}
                                                        {row.label ?
                                                            <span className='overline'>{row.label}</span> :
                                                            <span className='body-main'>{row.text}</span>
                                                        }
                                                    </>
                                                </span>
                                                {row.label ? (
                                                    <span className={styles['card-row-col']}>
                                                        <span className='body-main'>{row.text}</span>
                                                    </span>
                                                ) : <></>}
                                            </div>
                                    ))}
                                </div>
                            ))}
                        </label>
                    )
                })
            }
        </div>
    )
}

export default FormCardSet
