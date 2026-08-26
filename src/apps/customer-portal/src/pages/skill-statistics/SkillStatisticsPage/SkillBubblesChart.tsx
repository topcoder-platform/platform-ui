/* eslint-disable react/jsx-no-bind, no-use-before-define */
import {
    CSSProperties,
    FC,
    KeyboardEvent,
    RefObject,
    SVGProps,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import useSWR, { SWRResponse } from 'swr'

import { getRatingColor } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import {
    ExpertSkillCategory,
    ExpertSkillCategoryMember,
    expertSkillCategoryMembersCacheKey,
    fetchExpertSkillCategoryMembers,
} from '../../../lib'
import memberGroupIcon from '../../statistics/StatisticsPage/assets/member-group.svg'
import skillCognitionIcon from '../../statistics/StatisticsPage/assets/skill-cognition.svg'

import { packCircles, PackedCircle } from './packCircles'
import styles from './SkillBubblesChart.module.scss'

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const SKILL_COLORS = ['#c1294f', '#00797a', '#fdc220', '#a6a6a6']
const POPOVER_GAP = 12
const POPOVER_ESTIMATED_HEIGHT = 340
const POPOVER_WIDTH = 320
const VIEW_PAD = 8
const MIN_BUBBLE_FONT_SIZE = 10
const MAX_BUBBLE_FONT_SIZE = 16

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

type PopoverLayout = {
    arrowOffset?: number
    left: number
    placement: PopoverPlacement
    top: number
}

type ChartRect = {
    height: number
    left: number
    top: number
    width: number
}

function getPopoverLayout(
    circle: PackedCircle,
    chartRect: ChartRect,
    popoverWidth: number,
    popoverHeight: number,
): PopoverLayout {
    const viewWidth = typeof window === 'undefined' ? chartRect.width : window.innerWidth
    const viewHeight = typeof window === 'undefined' ? chartRect.height : window.innerHeight
    const centerX = chartRect.left + circle.x
    const centerY = chartRect.top + circle.y
    const bubbleTop = centerY - circle.r
    const bubbleBottom = centerY + circle.r
    const bubbleLeft = centerX - circle.r
    const bubbleRight = centerX + circle.r
    const spaceLeft = bubbleLeft - VIEW_PAD
    const spaceRight = viewWidth - VIEW_PAD - bubbleRight
    const fitsTop = bubbleTop - POPOVER_GAP - popoverHeight >= VIEW_PAD
    const fitsBottom = bubbleBottom + POPOVER_GAP + popoverHeight <= viewHeight - VIEW_PAD
    const fitsLeft = spaceLeft >= popoverWidth + POPOVER_GAP
    const fitsRight = spaceRight >= popoverWidth + POPOVER_GAP

    let placement: PopoverPlacement = 'top'
    if (fitsTop) {
        placement = 'top'
    } else if (fitsLeft && fitsRight) {
        placement = spaceRight >= spaceLeft ? 'right' : 'left'
    } else if (fitsRight) {
        placement = 'right'
    } else if (fitsLeft) {
        placement = 'left'
    } else if (fitsBottom) {
        placement = 'bottom'
    } else {
        placement = spaceRight >= spaceLeft ? 'right' : 'left'
    }

    if (placement === 'top') {
        return {
            left: centerX,
            placement,
            top: bubbleTop,
        }
    }

    if (placement === 'bottom') {
        return {
            left: centerX,
            placement,
            top: bubbleBottom,
        }
    }

    const desiredTop = centerY - (popoverHeight / 2)
    const clampedTop = Math.min(
        Math.max(desiredTop, VIEW_PAD),
        viewHeight - VIEW_PAD - popoverHeight,
    )

    return {
        arrowOffset: centerY - clampedTop,
        left: placement === 'right' ? bubbleRight : bubbleLeft,
        placement,
        top: clampedTop,
    }
}

type SkillCategoryIcon = FC<SVGProps<SVGSVGElement>>

interface SkillBubblesChartProps {
    categories: ExpertSkillCategory[]
    onSelect: (categoryId: string) => void
    selectedCategoryId?: string
}

function getCategoryIcon(iconName?: string): SkillCategoryIcon {
    const icons = IconOutline as Record<string, SkillCategoryIcon | undefined>
    const icon = iconName ? icons[iconName] : undefined

    return icon || IconOutline.CodeIcon
}

function radiusForSize(size: number): number {
    return 28 + (size * 9)
}

function fontSizeForRadius(
    radius: number,
    minRadius: number,
    maxRadius: number,
): number {
    if (maxRadius <= minRadius) {
        return (MIN_BUBBLE_FONT_SIZE + MAX_BUBBLE_FONT_SIZE) / 2
    }

    const t = (radius - minRadius) / (maxRadius - minRadius)

    return MIN_BUBBLE_FONT_SIZE + (t * (MAX_BUBBLE_FONT_SIZE - MIN_BUBBLE_FONT_SIZE))
}

const SkillBubblesChart: FC<SkillBubblesChartProps> = props => {
    const chartRef = useRef<HTMLDivElement>(null)
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string>()
    const [viewport, setViewport] = useState({ height: 560, width: 960 })

    useEffect(() => {
        const node = chartRef.current
        if (!node) {
            return undefined
        }

        const measure = (): void => {
            setViewport(current => {
                const height = Math.max(node.clientHeight, 1)
                const width = Math.max(node.clientWidth, 1)

                return current.width === width && current.height === height
                    ? current
                    : { height, width }
            })
        }

        measure()
        window.addEventListener('resize', measure)

        const observer = typeof ResizeObserver === 'undefined'
            ? undefined
            : new ResizeObserver(measure)
        observer?.observe(node)

        return () => {
            window.removeEventListener('resize', measure)
            observer?.disconnect()
        }
    }, [])

    const packed = useMemo(
        () => packCircles(
            props.categories.map(category => ({
                id: category.id,
                r: radiusForSize(category.size),
            })),
            viewport.width,
            viewport.height,
        ),
        [props.categories, viewport.height, viewport.width],
    )

    const packedById = useMemo(
        () => new Map(packed.map(circle => [circle.id, circle])),
        [packed],
    )
    const packedRadii = useMemo(
        () => packed.map(circle => circle.r),
        [packed],
    )
    const minPackedRadius = packedRadii.length ? Math.min(...packedRadii) : 0
    const maxPackedRadius = packedRadii.length ? Math.max(...packedRadii) : 0

    const hoveredCategory = props.categories.find(
        category => category.id === hoveredCategoryId,
    )
    const hoveredCircle = hoveredCategory
        ? packedById.get(hoveredCategory.id)
        : undefined
    const { data: hoveredMembers }: SWRResponse<ExpertSkillCategoryMember[], Error> = useSWR(
        hoveredCategory
            ? expertSkillCategoryMembersCacheKey(hoveredCategory.name)
            : undefined,
        () => fetchExpertSkillCategoryMembers(hoveredCategory?.name || ''),
    )
    const topMember = hoveredMembers?.[0]

    const handleKeyDown = useCallback((
        event: KeyboardEvent<HTMLButtonElement>,
        categoryId: string,
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            props.onSelect(categoryId)
        }
    }, [props])

    return (
        <div
            aria-label='Skill category bubbles'
            className={styles.chart}
            ref={chartRef}
            role='group'
        >
            {props.categories.map(category => {
                const circle = packedById.get(category.id)
                if (!circle) {
                    return undefined
                }

                const Icon = getCategoryIcon(category.icon)
                const isSelected = category.id === props.selectedCategoryId
                const fontSize = fontSizeForRadius(
                    circle.r,
                    minPackedRadius,
                    maxPackedRadius,
                )
                const innerSize = circle.r * 1.16
                const iconSize = Math.max(12, Math.min(22, innerSize / 5.5))

                return (
                    <button
                        aria-pressed={isSelected}
                        className={classNames(
                            styles.bubble,
                            isSelected && styles.selected,
                            hoveredCategoryId === category.id && styles.hovered,
                        )}
                        key={category.id}
                        onBlur={function onBlur() { setHoveredCategoryId(undefined) }}
                        onClick={function onClick() { props.onSelect(category.id) }}
                        onFocus={function onFocus() { setHoveredCategoryId(category.id) }}
                        onKeyDown={function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
                            handleKeyDown(event, category.id)
                        }}
                        onMouseEnter={function onMouseEnter() { setHoveredCategoryId(category.id) }}
                        onMouseLeave={function onMouseLeave() { setHoveredCategoryId(undefined) }}
                        style={{
                            backgroundColor: category.color,
                            fontSize,
                            height: circle.r * 2,
                            left: circle.x,
                            top: circle.y,
                            width: circle.r * 2,
                        }}
                        type='button'
                    >
                        <span className={styles.bubbleInner}>
                            <Icon aria-hidden='true' height={iconSize} width={iconSize} />
                            <span className={styles.label}>{category.name}</span>
                        </span>
                    </button>
                )
            })}
            {hoveredCategory && hoveredCircle && (
                <SkillCategoryPopover
                    category={hoveredCategory}
                    chartHeight={viewport.height}
                    chartRef={chartRef}
                    chartWidth={viewport.width}
                    circle={hoveredCircle}
                    key={hoveredCategory.id}
                    topMember={topMember}
                />
            )}
        </div>
    )
}

interface SkillCategoryPopoverProps {
    category: ExpertSkillCategory
    chartHeight: number
    chartRef: RefObject<HTMLDivElement>
    chartWidth: number
    circle: PackedCircle
    topMember?: ExpertSkillCategoryMember
}

const SkillCategoryPopover = (props: SkillCategoryPopoverProps): JSX.Element => {
    const popoverRef = useRef<HTMLDivElement>(null)
    const [layout, setLayout] = useState<PopoverLayout>({
        left: props.circle.x,
        placement: 'top',
        top: props.circle.y - props.circle.r,
    })

    useLayoutEffect(() => {
        const update = (): void => {
            const chartNode = props.chartRef.current
            const chartRect = chartNode?.getBoundingClientRect()
            const measured: ChartRect = chartRect && chartRect.width > 0
                ? chartRect
                : {
                    height: props.chartHeight,
                    left: 0,
                    top: 0,
                    width: props.chartWidth,
                }
            const height = popoverRef.current?.offsetHeight || POPOVER_ESTIMATED_HEIGHT
            const width = popoverRef.current?.offsetWidth || POPOVER_WIDTH
            setLayout(getPopoverLayout(props.circle, measured, width, height))
        }

        update()
        window.addEventListener('resize', update)
        window.addEventListener('scroll', update, true)

        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('scroll', update, true)
        }
    }, [props.category.id, props.chartHeight, props.chartRef, props.chartWidth, props.circle])

    const topSkillsPercentage = props.category.skillsBreakdown.reduce(
        (total, skill) => total + skill.percentage,
        0,
    )
    const skills = [
        ...props.category.skillsBreakdown,
        {
            name: 'Others',
            percentage: Math.max(100 - topSkillsPercentage, 0),
        },
    ].filter(skill => skill.percentage > 0)
    const countryCode = /^[A-Z]{2}$/.test(props.topMember?.countryCode || '')
        ? props.topMember?.countryCode.toLowerCase()
        : ''
    const popoverStyle: CSSProperties = {
        left: layout.left,
        top: layout.top,
    }

    if (layout.arrowOffset !== undefined) {
        Object.assign(popoverStyle, { '--arrow-offset': `${layout.arrowOffset}px` })
    }

    const popover = (
        <div
            className={classNames(
                styles.popover,
                layout.placement === 'bottom' && styles.below,
                layout.placement === 'left' && styles.left,
                layout.placement === 'right' && styles.right,
            )}
            data-placement={layout.placement}
            ref={popoverRef}
            style={popoverStyle}
        >
            <strong className={styles.popoverTitle}>{props.category.name}</strong>
            <div className={styles.metrics}>
                <div className={styles.metric}>
                    <span>Total Members</span>
                    <span className={styles.metricValue}>
                        <img alt='' src={memberGroupIcon} />
                        <strong>{NUMBER_FORMATTER.format(props.category.totalMembers)}</strong>
                    </span>
                </div>
                <div className={styles.metric}>
                    <span>Total Skills</span>
                    <span className={styles.metricValue}>
                        <img alt='' src={skillCognitionIcon} />
                        <strong>{NUMBER_FORMATTER.format(props.category.totalSkills)}</strong>
                    </span>
                </div>
            </div>
            <div className={styles.breakdown}>
                <span>Sub-Skill Breakdown</span>
                <div className={styles.bar}>
                    {skills.map((skill, index) => (
                        <span
                            className={styles.segment}
                            key={skill.name}
                            style={{
                                backgroundColor: SKILL_COLORS[Math.min(index, SKILL_COLORS.length - 1)],
                                width: `${skill.percentage}%`,
                            }}
                        >
                            {`${skill.percentage}%`}
                        </span>
                    ))}
                </div>
                <div className={styles.legend}>
                    {skills.map((skill, index) => (
                        <span className={styles.legendItem} key={`${skill.name}-legend`}>
                            <span
                                className={styles.dot}
                                style={{
                                    backgroundColor: SKILL_COLORS[Math.min(index, SKILL_COLORS.length - 1)],
                                }}
                            />
                            <span>{skill.name}</span>
                        </span>
                    ))}
                </div>
            </div>
            {props.topMember && (
                <div className={styles.topMember}>
                    <span>Top Member</span>
                    <div className={styles.topMemberContent}>
                        <span className={styles.avatar}>
                            <span className={styles.avatarHead} />
                            <span className={styles.avatarBody} />
                        </span>
                        <span>
                            <span
                                className={styles.handle}
                                style={{ color: getRatingColor(props.topMember.rating) }}
                            >
                                {props.topMember.handle}
                            </span>
                            <span className={styles.memberStats}>
                                {countryCode && (
                                    <span
                                        aria-hidden='true'
                                        className={`${styles.flag} fi fi-${countryCode}`}
                                    />
                                )}
                                <span>
                                    {props.topMember.countryName}
                                    <span className={styles.divider}>|</span>
                                    Wins:
                                    {' '}
                                    <strong>
                                        {NUMBER_FORMATTER.format(props.topMember.wins)}
                                    </strong>
                                </span>
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    )

    return typeof document === 'undefined'
        ? popover
        : createPortal(popover, document.body)
}

export default SkillBubblesChart
