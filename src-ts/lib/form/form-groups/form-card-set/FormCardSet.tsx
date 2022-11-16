import React, { FocusEvent, SVGProps } from 'react'
import cn from 'classnames'

import {
    Button,
    IconCheck,
    IconOutline,
    IconSolid,
    textFormatMoneyLocaleString,
    Tooltip,
    useCheckIsMobile,
} from '../../..'
import { FormCard, FormInputModel } from '../../form-input.model'

import styles from './FormCardSet.module.scss'

interface FormCardSetProps extends FormInputModel {
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
}

const FormCardSet: React.FC<FormCardSetProps> = (props: FormCardSetProps) => {

    const isMobile: boolean = useCheckIsMobile()

    const iconFromName: (icon: string) => JSX.Element = (icon: string) => {
        if (!icon) {
            return <></>
        }

        const iconName: string = `${icon.split('-')
            .map((chunk: string) => chunk.charAt(0)
                .toUpperCase() + chunk.slice(1))
            .join('')}Icon`
        const IconComponent: React.FC<SVGProps<SVGSVGElement>> = IconOutline[iconName as keyof typeof IconOutline]
        return <IconComponent className={styles['card-row-icon']} />
    }

    const getButton: (card: FormCard, selected: boolean) => JSX.Element = (card, selected) => (
        <Button
            onClick={evt => props.onChange(evt)}
            label={selected ? 'Selected' : 'Choose package'}
            buttonStyle={selected ? 'primary' : 'secondary'}
            type={selected ? 'button' : 'submit'}
            size='sm'
            icon={selected ? IconCheck : undefined}
            id={card.id}
            name={props.name}
            className={selected ? 'flex-row' : ''}
        />
    )

    return (
        <div className={styles['form-card-set']}>
            {
                props.cards?.map((card, index: number) => {
                    const formattedPrice: string | undefined = textFormatMoneyLocaleString(card.price)
                    const selected: boolean = props.value === card.id
                    return (
                        <div
                            key={`card-${card.id}`}
                            className={cn(
                                styles.card,
                                selected && styles.selected,
                                isMobile && card.mostPopular && styles['mobile-popular'],
                                {
                                    [styles.feature]: index === 0,
                                    [styles.mobile]: isMobile,
                                },
                            )}
                        >
                            {card.mostPopular && <div className={styles['popular-card']}>MOST POPULAR</div>}
                            <div
                                className={cn(
                                    styles['card-header'],
                                    isMobile && styles.mobile,
                                    { [styles.feature]: index === 0 },
                                )}
                            >
                                <div className='body-large-bold'>{card.title}</div>
                                <h3>{formattedPrice}</h3>
                                {getButton(card, selected)}
                            </div>
                            {card.sections.map(section => (
                                <div
                                    key={`section-${section.rows?.[0]?.label}`}
                                    className={cn(
                                        styles['card-section'],
                                        {
                                            [styles.mobile]: isMobile,
                                            [styles.feature]: index === 0,
                                        },
                                    )}
                                >
                                    {section.rows.map(row => (
                                        <div className={styles.row}>
                                            <div className={styles['row-divider']} />
                                            <div
                                                key={`row-${row.label}`}
                                                className={styles['card-row']}
                                            >
                                                {((isMobile) || (index === 0)) && (
                                                    <span className={cn(
                                                        styles['card-row-col'],
                                                        styles.mobile,
                                                        styles['feature-name'],
                                                    )}
                                                    >
                                                        {row.icon && iconFromName(row.icon)}
                                                        {row.label
                                                            ? (
                                                                <span className={cn('overline', styles.label)}>
                                                                    {row.label}
                                                                </span>
                                                            )
                                                            : <span className='body-main'>{row.text}</span>}
                                                        {row.infoIcon && (
                                                            <Tooltip
                                                                content={row.tooltipText}
                                                                trigger={(
                                                                    <IconSolid.InformationCircleIcon
                                                                        className={styles['info-icon']}
                                                                    />
                                                                )}
                                                            />
                                                        )}
                                                    </span>
                                                )}
                                                <span className={cn(styles['card-row-col'], styles.center)}>
                                                    {row.valueIcon
                                                        ? <IconOutline.CheckIcon className={styles['check-icon']} />
                                                        : <span className='body-main'>{row.text}</span>}
                                                </span>
                                            </div>
                                            <div className={styles['row-divider']} />
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
