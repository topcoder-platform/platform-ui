import { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'

import worldMap from '@highcharts/map-collection/custom/world.topo.json'

import {
    ISO3_TO_2,
    StatisticsCountry,
    StatisticsSkill,
    StatisticsWinner,
} from '../../../lib/services/statistics.service'
import { getRatingColor } from '../../../../../../libs/core/lib/profile/profile-functions/rating.functions'

import fullscreenIcon from './assets/fullscreen.svg'
import memberGroupIcon from './assets/member-group.svg'
import skillCognitionIcon from './assets/skill-cognition.svg'
import styles from './StatisticsPage.module.scss'

interface WorldMapProps {
    countries: StatisticsCountry[]
    showWinnerDetails: boolean
    valueLabel: string
    hoveredCountryCode?: string
}

interface StatisticsMapPoint {
    code: string
    name: string
    skillsBreakdown: StatisticsSkill[]
    topMembers: StatisticsWinner[]
    topWinners: StatisticsWinner[]
    totalSkills: number
    value: number
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function safeImageUrl(value?: string): string {
    if (!value) {
        return ''
    }

    try {
        const url = new URL(value, window.location.origin)
        return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch {
        return ''
    }
}

function normalizeCountryCode(code?: string): string {
    if (!code) {
        return ''
    }

    const normalized = String(code)
        .trim()
        .toUpperCase()
    if (normalized.length === 3) {
        return ISO3_TO_2.get(normalized) ?? normalized
    }

    return normalized
}

function renderAvatar(winner: StatisticsWinner): string {
    const photoURL = safeImageUrl(winner.photoURL)
    const avatarStyle = photoURL
        ? ` style="background-image: url(&quot;${escapeHtml(photoURL)}&quot;)"`
        : ''

    return `
        <span class="${styles.tooltipAvatar}"${avatarStyle}>
            <span class="${styles.tooltipAvatarHead}"></span>
            <span class="${styles.tooltipAvatarBody}"></span>
        </span>
    `
}

function renderWinner(winner: StatisticsWinner): string {
    return `
        <div class="${styles.tooltipWinner}">
            ${renderAvatar(winner)}
            <span class="${styles.tooltipWinnerText}">
                <span
                    class="${styles.tooltipHandle}"
                    style="color: ${escapeHtml(
        getRatingColor(winner.maxRating),
    )}"
                >${escapeHtml(winner.handle)}</span>
                <span class="${styles.tooltipWins}">
                    Wins: <strong>${NUMBER_FORMATTER.format(
        winner.wins,
    )}</strong>
                </span>
            </span>
        </div>
    `
}

function renderWinnersTooltip(point: StatisticsMapPoint): string {
    const normalizedCode = /^[A-Z]{2}$/.test(point.code)
        ? point.code.toLowerCase()
        : ''
    const flag = normalizedCode
        ? `<span class="${styles.tooltipFlag} fi fi-${normalizedCode}"></span>`
        : ''
    const winnerRows = point.topWinners.map(renderWinner)

    return `
        <div class="${styles.mapTooltip}">
            <div class="${styles.tooltipHeader}">
                <div class="${styles.tooltipCountry}">
                    ${flag}
                    <strong>${escapeHtml(point.name)}</strong>
                </div>
                <span>Winners: ${NUMBER_FORMATTER.format(point.value)}</span>
            </div>
            <span class="${styles.tooltipSectionTitle}">Top Winners</span>
            <div class="${styles.tooltipWinners}">
                ${winnerRows.join('')}
            </div>
        </div>
    `
}

const SKILL_COLORS = ['#c1294f', '#00797a', '#fdc220', '#a6a6a6']
const COLOR_AXIS_COLORS = ['#dcebe8', '#b9d8d3', '#69b2b8', '#238a9b']
const COLOR_AXIS_CLASS_COUNT = 4

function getColorAxisBucketSize(maxValue: number): number {
    if (maxValue <= 0) {
        return 1
    }

    const rawBucketSize = maxValue / COLOR_AXIS_CLASS_COUNT
    const magnitude = 10 ** Math.floor(Math.log10(rawBucketSize))
    const normalized = rawBucketSize / magnitude
    const niceNormalized
        = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

    return Math.max(1, niceNormalized * magnitude)
}

function buildColorAxisDataClasses(
    maxValue: number,
    label: string,
): Highcharts.ColorAxisDataClassesOptions[] {
    if (maxValue <= 0) {
        return [
            {
                color: COLOR_AXIS_COLORS[0],
                from: 0,
                name: `0 ${label}`,
            },
        ]
    }

    const bucketSize = getColorAxisBucketSize(maxValue)

    return COLOR_AXIS_COLORS.map((color, index) => {
        const from = index * bucketSize + 1
        const to
            = index === COLOR_AXIS_COLORS.length - 1
                ? undefined
                : (index + 1) * bucketSize
        const range = to
            ? `${NUMBER_FORMATTER.format(from)} - ${NUMBER_FORMATTER.format(
                to,
            )}`
            : `${NUMBER_FORMATTER.format(from)}+`

        return {
            color,
            from,
            name: `${range} ${label.replace(/s$/, '')
                .toLowerCase()}s`,
            to,
        }
    })
}

function renderSkillBreakdown(point: StatisticsMapPoint): string {
    const topSkillsPercentage = point.skillsBreakdown.reduce(
        (total, skill) => total + skill.percentage,
        0,
    )
    if (topSkillsPercentage <= 0) {
        return ''
    }

    const skills: StatisticsSkill[] = [
        ...point.skillsBreakdown,
        {
            count: 0,
            name: 'Others',
            percentage: Math.max(100 - topSkillsPercentage, 0),
        },
    ].filter(skill => skill.percentage > 0)
    let remainingPercentage = 100
    const breakdown = skills.map((skill, index) => {
        const percentage
            = index === skills.length - 1
                ? remainingPercentage
                : Math.round(skill.percentage)
        remainingPercentage -= percentage

        return {
            color: SKILL_COLORS[Math.min(index, SKILL_COLORS.length - 1)],
            name: skill.name,
            percentage: Math.max(percentage, 0),
            width: skill.percentage,
        }
    })
    const segments = breakdown.map(
        item => `
        <span
            class="${styles.tooltipSkillSegment}"
            style="background-color: ${item.color}; width: ${item.width}%"
        >${item.percentage}%</span>
    `,
    )
    const legend = breakdown.map(
        item => `
        <span class="${styles.tooltipSkillLegendItem}">
            <span
                class="${styles.tooltipSkillDot}"
                style="background-color: ${item.color}"
            ></span>
            <span>${escapeHtml(item.name)}</span>
        </span>
    `,
    )

    return `
        <div class="${styles.tooltipSkillBreakdown}">
            <span>Sub-Skill Breakdown</span>
            <div class="${styles.tooltipSkillBar}">${segments.join('')}</div>
            <div class="${styles.tooltipSkillLegend}">${legend.join('')}</div>
        </div>
    `
}

function renderCountryTooltip(point: StatisticsMapPoint): string {
    const normalizedCode = /^[A-Z]{2}$/.test(point.code)
        ? point.code.toLowerCase()
        : ''
    const flag = normalizedCode
        ? `<span class="${styles.tooltipMemberFlag} fi fi-${normalizedCode}"></span>`
        : ''
    const topMemberRows = point.topMembers.map(
        member => `
        <div class="${styles.tooltipTopMemberContent}">
            ${renderAvatar(member)}
            <span class="${styles.tooltipWinnerText}">
                <span
                    class="${styles.tooltipHandle}"
                    style="color: ${escapeHtml(
        getRatingColor(member.maxRating),
    )}"
                >${escapeHtml(member.handle)}</span>
                <span class="${styles.tooltipMemberStats}">
                    ${flag}
                    <span>
                        ${escapeHtml(point.name)}
                        <span class="${styles.tooltipMemberDivider}">|</span>
                        Wins: <strong>${NUMBER_FORMATTER.format(
        member.wins,
    )}</strong>
                    </span>
                </span>
            </span>
        </div>
    `,
    )
    const topMembers
        = topMemberRows.length > 0
            ? `
            <div class="${styles.tooltipTopMember}">
                <span class="${styles.tooltipSectionTitle}">Top Members</span>
                ${topMemberRows.join('')}
            </div>
        `
            : ''

    return `
        <div class="${styles.countryMapTooltip}">
            <strong class="${styles.tooltipCountryTitle}">${escapeHtml(
    point.name,
)}</strong>
            <div class="${styles.tooltipMetrics}">
                <div class="${styles.tooltipMetric}">
                    <span>Total Members</span>
                    <span class="${styles.tooltipMetricValue}">
                        <img alt="" src="${escapeHtml(memberGroupIcon)}" />
                        <strong>${NUMBER_FORMATTER.format(point.value)}</strong>
                    </span>
                </div>
                <div class="${styles.tooltipMetric}">
                    <span>Total Skills</span>
                    <span class="${styles.tooltipMetricValue}">
                        <img alt="" src="${escapeHtml(skillCognitionIcon)}" />
                        <strong>${NUMBER_FORMATTER.format(
        point.totalSkills,
    )}</strong>
                    </span>
                </div>
            </div>
            ${renderSkillBreakdown(point)}
            ${topMembers}
        </div>
    `
}

function createTooltipFormatter(
    props: Pick<WorldMapProps, 'showWinnerDetails'>,
): Highcharts.TooltipFormatterCallbackFunction {
    return function formatTooltip(
        this: Highcharts.TooltipFormatterContextObject,
    ): string {
        const point = this.point as Highcharts.Point & StatisticsMapPoint

        if (props.showWinnerDetails) {
            return renderWinnersTooltip(point)
        }

        return renderCountryTooltip(point)
    }
}

interface ChartDataPoint {
    code: string
    name: string
    skillsBreakdown: StatisticsSkill[]
    topMembers: StatisticsWinner[]
    topWinners: StatisticsWinner[]
    totalSkills: number
    value: number
}

const WorldMap: FC<WorldMapProps> = props => {
    const mapRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const hoveredPointRef = useRef<Highcharts.Point | null>(null)
    const chartData: ChartDataPoint[] = useMemo(
        () => props.countries.map(country => {
            const code = String(country.code ?? '')
                .toUpperCase()
            const iso2
                    = code.length === 3 ? ISO3_TO_2.get(code) ?? code : code

            return {
                code: iso2,
                name: country.name,
                skillsBreakdown: country.skillsBreakdown || [],
                topMembers: country.topMembers || [],
                topWinners: country.topWinners || [],
                totalSkills: country.totalSkills || 0,
                value: country.count,
            }
        }),
        [props.countries],
    )
    const maxChartValue = useMemo(
        () => chartData.reduce(
            (maxValue, point) => Math.max(maxValue, point.value || 0),
            0,
        ),
        [chartData],
    )
    const colorAxisDataClasses = useMemo(
        () => buildColorAxisDataClasses(maxChartValue, props.valueLabel),
        [maxChartValue],
    )

    const normalizedHoveredCountry = useMemo(
        () => normalizeCountryCode(props.hoveredCountryCode),
        [props.hoveredCountryCode],
    )

    useEffect(() => {
        const chart = chartRef.current?.chart
        if (!chart) {
            return
        }

        const clearHover = (): void => {
            if (hoveredPointRef.current) {
                hoveredPointRef.current.setState('')
                hoveredPointRef.current = null
            }

            chart.tooltip?.hide()
        }

        if (!normalizedHoveredCountry) {
            clearHover()
            return
        }

        const series = chart.series?.[0]
        if (!series) {
            clearHover()
            return
        }

        const hoveredPoint = series.data.find((point: any) => {
            const pointCode = normalizeCountryCode(
                String(point.options?.code ?? point.code ?? point?.properties?.['iso-a2'] ?? ''),
            )
            return pointCode && pointCode === normalizedHoveredCountry
        })

        if (!hoveredPoint) {
            clearHover()
            return
        }

        if (hoveredPointRef.current && hoveredPointRef.current !== hoveredPoint) {
            hoveredPointRef.current.setState('')
        }

        hoveredPointRef.current = hoveredPoint
        hoveredPoint.setState('hover')
        chart.tooltip.refresh(hoveredPoint)
    }, [normalizedHoveredCountry, props.showWinnerDetails])

    const chartOptions = useMemo<Highcharts.Options>(
        () => ({
            chart: {
                backgroundColor: '#ffffff',
                map: worldMap as any,
                margin: [12, 8, 54, 8],
                plotBackgroundColor: '#f8f8f8',
                spacing: [0, 0, 0, 0],
            },
            colorAxis: {
                dataClasses: colorAxisDataClasses,
            },
            credits: {
                enabled: false,
            },
            legend: {
                align: 'center',
                itemDistance: 14,
                itemStyle: {
                    color: '#2a2a2a',
                    fontFamily: 'Nunito Sans, sans-serif',
                    fontSize: '10px',
                    fontWeight: '400',
                },
                layout: 'horizontal',
                symbolHeight: 9,
                symbolRadius: 5,
                symbolWidth: 9,
                verticalAlign: 'bottom',
            },
            mapNavigation: {
                enableButtons: false,
                enabled: true,
                enableDoubleClickZoom: true,
                enableMouseWheelZoom: true,
                enableTouchZoom: true,
            },
            plotOptions: {
                map: {
                    borderColor: '#ffffff',
                    borderWidth: 0.6,
                    nullColor: '#edf0ef',
                    states: {
                        hover: {
                            borderColor: '#ffffff',
                            brightness: -0.08,
                        },
                    },
                },
            },
            responsive: {
                rules: [
                    {
                        chartOptions: {
                            chart: {
                                margin: [0, 0, 80, 0],
                            },
                            legend: {
                                itemDistance: 24,
                                itemMarginBottom: 4,
                                itemStyle: {
                                    fontSize: '12px',
                                },
                                symbolHeight: 12,
                                symbolWidth: 12,
                                width: 340,
                            },
                        },
                        condition: {
                            maxWidth: 480,
                        },
                    },
                ],
            },
            series: [
                {
                    data: chartData,
                    joinBy: ['iso-a2', 'code'],
                    name: `<div>${props.valueLabel}</div>`,
                    type: 'map',
                },
            ],
            title: {
                text: '',
            },
            tooltip: {
                backgroundColor: 'transparent',
                borderWidth: 0,
                formatter: createTooltipFormatter({
                    showWinnerDetails: props.showWinnerDetails,
                }),
                padding: 0,
                shadow: false,
                useHTML: true,
            },
        }),
        [
            chartData,
            colorAxisDataClasses,
            props.showWinnerDetails,
            props.valueLabel,
        ],
    )

    const toggleFullscreen = useCallback(async () => {
        if (document.fullscreenElement === mapRef.current) {
            await document.exitFullscreen()
        } else {
            await mapRef.current?.requestFullscreen()
        }
    }, [])

    useEffect(() => {
        const resizeChart = (): void => {
            window.dispatchEvent(new Event('resize'))
        }

        document.addEventListener('fullscreenchange', resizeChart)

        return () => document.removeEventListener('fullscreenchange', resizeChart)
    }, [])

    return (
        <div
            className={styles.map}
            aria-label={`World map of ${props.valueLabel.toLowerCase()}`}
            ref={mapRef}
        >
            <HighchartsReact
                constructorType='mapChart'
                highcharts={Highcharts}
                options={chartOptions}
                ref={chartRef}
            />
            <button
                aria-label='Toggle fullscreen map'
                className={styles.mapFullscreenButton}
                onClick={toggleFullscreen}
                type='button'
            >
                <img alt='' src={fullscreenIcon} />
            </button>
        </div>
    )
}

export default WorldMap
