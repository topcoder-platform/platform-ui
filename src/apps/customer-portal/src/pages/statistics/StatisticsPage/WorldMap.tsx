import { FC, useMemo } from 'react'
import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'

import worldMap from '@highcharts/map-collection/custom/world.topo.json'

import {
    ISO3_TO_2,
    StatisticsCountry,
    StatisticsWinner,
} from '../../../lib/services/statistics.service'
import { getRatingColor } from '../../../../../../libs/core/lib/profile/profile-functions/rating.functions'

import styles from './StatisticsPage.module.scss'

interface WorldMapProps {
    countries: StatisticsCountry[]
    showWinnerDetails: boolean
    valueLabel: string
}

interface StatisticsMapPoint {
    code: string
    name: string
    topWinners: StatisticsWinner[]
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

function renderWinner(winner: StatisticsWinner): string {
    const photoURL = safeImageUrl(winner.photoURL)
    const avatarStyle = photoURL
        ? ` style="background-image: url(&quot;${escapeHtml(photoURL)}&quot;)"`
        : ''

    return `
        <div class="${styles.tooltipWinner}">
            <span class="${styles.tooltipAvatar}"${avatarStyle}>
                <span class="${styles.tooltipAvatarHead}"></span>
                <span class="${styles.tooltipAvatarBody}"></span>
            </span>
            <span class="${styles.tooltipWinnerText}">
                <span
                    class="${styles.tooltipHandle}"
                    style="color: ${escapeHtml(getRatingColor(winner.maxRating))}"
                >${escapeHtml(winner.handle)}</span>
                <span class="${styles.tooltipWins}">
                    Wins: <strong>${NUMBER_FORMATTER.format(winner.wins)}</strong>
                </span>
            </span>
        </div>
    `
}

function renderWinnersTooltip(point: StatisticsMapPoint): string {
    const normalizedCode = /^[A-Z]{2}$/.test(point.code) ? point.code.toLowerCase() : ''
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

function createTooltipFormatter(
    props: Pick<WorldMapProps, 'showWinnerDetails' | 'valueLabel'>,
): Highcharts.TooltipFormatterCallbackFunction {
    return function formatTooltip(
        this: Highcharts.TooltipFormatterContextObject,
    ): string {
        const point = this.point as Highcharts.Point & StatisticsMapPoint

        if (props.showWinnerDetails) {
            return renderWinnersTooltip(point)
        }

        return `
            <div class="${styles.mapTooltipCompact}">
                <strong>${escapeHtml(point.name)}</strong><br />
                <strong>${NUMBER_FORMATTER.format(point.value)}</strong>
                ${escapeHtml(props.valueLabel.toLowerCase())}
            </div>
        `
    }
}

const WorldMap: FC<WorldMapProps> = props => {
    const chartData = useMemo(() => props.countries.map(country => {
        const code = String(country.code ?? '')
            .toUpperCase()
        const iso2 = code.length === 3 ? ISO3_TO_2.get(code) ?? code : code

        return {
            code: iso2,
            name: country.name,
            topWinners: country.topWinners || [],
            value: country.count,
        }
    }), [props.countries])

    const chartOptions = useMemo<Highcharts.Options>(() => ({
        chart: {
            backgroundColor: '#f8f8f8',
            map: worldMap as any,
            margin: [12, 8, 54, 8],
            spacing: [0, 0, 0, 0],
        },
        colorAxis: {
            dataClasses: [{
                color: '#dcebe8',
                from: 1,
                name: '1 - 999',
                to: 999,
            }, {
                color: '#b9d8d3',
                from: 1000,
                name: '1,000 - 99,999',
                to: 99999,
            }, {
                color: '#69b2b8',
                from: 100000,
                name: '100,000 - 399,999',
                to: 399999,
            }, {
                color: '#238a9b',
                from: 400000,
                name: '400,000+',
            }],
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
            enableMouseWheelZoom: false,
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
        series: [{
            data: chartData,
            joinBy: ['iso-a2', 'code'],
            name: `<div>${props.valueLabel}</div>`,
            type: 'map',
        }],
        title: {
            text: '',
        },
        tooltip: {
            backgroundColor: 'transparent',
            borderWidth: 0,
            formatter: createTooltipFormatter(props),
            padding: 0,
            shadow: false,
            useHTML: true,
        },
    }), [chartData, props.showWinnerDetails, props.valueLabel])

    return (
        <div className={styles.map} aria-label={`World map of ${props.valueLabel.toLowerCase()}`}>
            <HighchartsReact
                constructorType='mapChart'
                highcharts={Highcharts}
                options={chartOptions}
            />
        </div>
    )
}

export default WorldMap
