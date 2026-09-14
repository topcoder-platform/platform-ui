/* eslint-disable react/jsx-no-bind, no-use-before-define */
import {
    CSSProperties,
    FC,
    KeyboardEvent,
    RefObject,
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

import {
    ExpertSkillCategory,
    ExpertSkillCategoryMember,
    expertSkillCategoryMembersCacheKey,
    fetchExpertSkillCategoryMembers,
} from '../../../lib'
import memberGroupIcon from '../../statistics/StatisticsPage/assets/member-group.svg'
import skillCognitionIcon from '../../statistics/StatisticsPage/assets/skill-cognition.svg'

import { packCircles, packedBoundsHeight, PackedCircle } from './packCircles'
import { MOBILE_MAX_WIDTH, useMobileView } from './useMobileView'
import styles from './SkillBubblesChart.module.scss'

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const SKILL_COLORS = ['#c1294f', '#00797a', '#fdc220', '#a6a6a6']
const POPOVER_GAP = 12
const POPOVER_ESTIMATED_HEIGHT = 340
const POPOVER_WIDTH = 320
const VIEW_PAD = 8
const MIN_BUBBLE_FONT_SIZE = 10
const MAX_BUBBLE_FONT_SIZE = 16
const DOUBLE_TAP_MS = 450

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

function normalizeCategoryName(value: string): string {
    return value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

const CATEGORY_ICON_BY_NAME: Record<string, string> = {
    blockchain: 'hub',
    'cloud computing': 'desktop_cloud_stack',
    cybersecurity: 'shield_lock',
    'data analysis and big data': 'analytics',
    'database management': 'database',
    'databases and data warehousing': 'data_table',
    'devops and automation': 'rule_settings',
    'geospatial information systems': 'map',
    'geospatial information systems gis': 'map',
    'hardware and systems administration': 'install_desktop',
    'iot internet of things': 'devices_other',
    'machine learning and ai': 'psychology',
    'mathematics and statistics': 'calculate',
    'mobile app development': 'mobile_gear',
    'networking and telecommunications': 'cell_tower',
    'operating systems': 'memory',
    'programming and development': 'terminal',
    'project management': 'assignment',
    'scripting and automation': 'integration_instructions',
    sdlc: 'cloud_sync',
    'software development lifecycle': 'cloud_sync',
    'software development lifecycle sdlc': 'cloud_sync',
    'software testing and qa': 'fact_check',
    'software testing and quality assurance': 'fact_check',
    'user experience design and multimedia': 'design_services',
    'ux design and multimedia': 'design_services',
    virtualization: 'layers',
    'web development': 'language',
}

function getCategoryIconName(iconName?: string, categoryName?: string): string {
    if (categoryName) {
        const mapped = CATEGORY_ICON_BY_NAME[normalizeCategoryName(categoryName)]
        if (mapped) {
            return mapped
        }
    }

    if (iconName && /^[a-z0-9_]+$/.test(iconName)) {
        return iconName
    }

    return 'terminal'
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

function getAnchoredPopoverLayout(
    circle: PackedCircle,
    chartWidth: number,
    chartHeight: number,
    popoverWidth: number,
    popoverHeight: number,
): PopoverLayout {
    const bubbleTop = circle.y - circle.r
    const bubbleBottom = circle.y + circle.r
    const fitsTop = bubbleTop - POPOVER_GAP - popoverHeight >= VIEW_PAD
    const fitsBottom = bubbleBottom + POPOVER_GAP + popoverHeight <= chartHeight - VIEW_PAD
    const placement: PopoverPlacement = fitsTop || !fitsBottom ? 'top' : 'bottom'
    const halfWidth = popoverWidth / 2
    const minLeft = VIEW_PAD + halfWidth
    const maxLeft = chartWidth - VIEW_PAD - halfWidth
    const left = maxLeft < minLeft
        ? chartWidth / 2
        : Math.min(Math.max(circle.x, minLeft), maxLeft)
    const layout: PopoverLayout = {
        left,
        placement,
        top: placement === 'top' ? bubbleTop : bubbleBottom,
    }

    if (Math.abs(left - circle.x) > 1) {
        layout.arrowOffset = halfWidth + (circle.x - left)
    }

    return layout
}

interface SkillBubblesChartProps {
    categories: ExpertSkillCategory[]
    onSelect: (categoryId: string) => void
    selectedCategoryId?: string
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
    const lastTapRef = useRef<{ at: number; id: string }>()
    const isMobileView = useMobileView()
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string>()
    const [previewedCategoryId, setPreviewedCategoryId] = useState<string>()
    const [viewport, setViewport] = useState(() => ({
        height: 560,
        width: typeof window === 'undefined' ? 960 : Math.min(window.innerWidth, 960),
    }))

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

    const isMobile = viewport.width > 0 && viewport.width <= MOBILE_MAX_WIDTH
    const packed = useMemo(
        () => packCircles(
            props.categories.map(category => ({
                id: category.id,
                r: radiusForSize(category.size),
            })),
            viewport.width,
            viewport.height,
            isMobile ? { fit: 'width' } : undefined,
        ),
        [isMobile, props.categories, viewport.height, viewport.width],
    )
    const packedHeight = useMemo(
        () => packedBoundsHeight(packed),
        [packed],
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
    const previewedCategory = props.categories.find(
        category => category.id === previewedCategoryId,
    )
    const popoverCategory = hoveredCategory || previewedCategory
    const popoverCircle = popoverCategory
        ? packedById.get(popoverCategory.id)
        : undefined
    const { data: popoverMembers }: SWRResponse<ExpertSkillCategoryMember[], Error> = useSWR(
        popoverCategory
            ? expertSkillCategoryMembersCacheKey(popoverCategory.name)
            : undefined,
        () => fetchExpertSkillCategoryMembers(popoverCategory?.name || ''),
    )
    const topMember = popoverMembers?.[0]

    const hidePopover = useCallback(() => {
        lastTapRef.current = undefined
        setPreviewedCategoryId(undefined)
        setHoveredCategoryId(undefined)
    }, [])

    const openMembersTable = useCallback((categoryId: string) => {
        lastTapRef.current = undefined
        setPreviewedCategoryId(undefined)
        if (isMobileView) {
            setHoveredCategoryId(undefined)
        }

        props.onSelect(categoryId)
    }, [isMobileView, props])

    const handleBubbleClick = useCallback((categoryId: string) => {
        if (!isMobileView) {
            openMembersTable(categoryId)
            return
        }

        const now = Date.now()
        const lastTap = lastTapRef.current
        if (lastTap && lastTap.id === categoryId && now - lastTap.at <= DOUBLE_TAP_MS) {
            openMembersTable(categoryId)
            return
        }

        if (previewedCategoryId === categoryId) {
            hidePopover()
            return
        }

        lastTapRef.current = { at: now, id: categoryId }
        setPreviewedCategoryId(categoryId)
        setHoveredCategoryId(categoryId)
    }, [hidePopover, isMobileView, openMembersTable, previewedCategoryId])

    useEffect(() => {
        const onPointerDown = (event: Event): void => {
            const target = event.target
            if (target instanceof Element && target.closest('[aria-label="Skill category bubbles"] button')) {
                return
            }

            hidePopover()
        }

        document.addEventListener('pointerdown', onPointerDown)

        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
        }
    }, [hidePopover])

    const handleKeyDown = useCallback((
        event: KeyboardEvent<HTMLButtonElement>,
        categoryId: string,
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openMembersTable(categoryId)
        }
    }, [openMembersTable])

    return (
        <div
            aria-label='Skill category bubbles'
            className={styles.chart}
            ref={chartRef}
            role='group'
            style={isMobile && packedHeight ? { height: packedHeight, minHeight: packedHeight } : undefined}
        >
            {props.categories.map(category => {
                const circle = packedById.get(category.id)
                if (!circle) {
                    return undefined
                }

                const iconName = getCategoryIconName(category.icon, category.name)
                const isSelected = category.id === props.selectedCategoryId
                    || category.id === previewedCategoryId
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
                        onClick={function onClick() { handleBubbleClick(category.id) }}
                        onDoubleClick={function onDoubleClick() {
                            if (isMobileView) {
                                openMembersTable(category.id)
                            }
                        }}
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
                            <span
                                aria-hidden='true'
                                className={styles.materialIcon}
                                style={{ fontSize: iconSize }}
                            >
                                {iconName}
                            </span>
                            <span className={styles.label}>{category.name}</span>
                        </span>
                    </button>
                )
            })}
            {popoverCategory && popoverCircle && (
                <SkillCategoryPopover
                    anchored={isMobile}
                    category={popoverCategory}
                    chartHeight={viewport.height}
                    chartRef={chartRef}
                    chartWidth={viewport.width}
                    circle={popoverCircle}
                    key={popoverCategory.id}
                    topMember={topMember}
                />
            )}
        </div>
    )
}

interface SkillCategoryPopoverProps {
    anchored?: boolean
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
            const height = popoverRef.current?.offsetHeight || POPOVER_ESTIMATED_HEIGHT
            const width = popoverRef.current?.offsetWidth || POPOVER_WIDTH

            if (props.anchored) {
                setLayout(getAnchoredPopoverLayout(
                    props.circle,
                    props.chartWidth,
                    props.chartHeight,
                    width,
                    height,
                ))
                return
            }

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
            setLayout(getPopoverLayout(props.circle, measured, width, height))
        }

        update()
        window.addEventListener('resize', update)
        if (!props.anchored) {
            window.addEventListener('scroll', update, true)
        }

        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('scroll', update, true)
        }
    }, [
        props.anchored,
        props.category.id,
        props.chartHeight,
        props.chartRef,
        props.chartWidth,
        props.circle,
    ])

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
        if (layout.placement === 'left' || layout.placement === 'right') {
            Object.assign(popoverStyle, { '--arrow-offset': `${layout.arrowOffset}px` })
        } else {
            Object.assign(popoverStyle, { '--arrow-x': `${layout.arrowOffset}px` })
        }
    }

    const popover = (
        <div
            className={classNames(
                styles.popover,
                props.anchored && styles.anchored,
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

    if (props.anchored || typeof document === 'undefined') {
        return popover
    }

    return createPortal(popover, document.body)
}

export default SkillBubblesChart
