import { FC, useMemo } from 'react'
import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'

import worldMap from '@highcharts/map-collection/custom/world.topo.json'

import { ISO3_TO_2, StatisticsCountry } from '../../../lib'

import styles from './StatisticsPage.module.scss'

interface WorldMapProps {
    countries: StatisticsCountry[]
    valueLabel: string
}

const WorldMap: FC<WorldMapProps> = props => {
    const chartData = useMemo(() => props.countries.map(country => {
        const code = String(country.code ?? '').toUpperCase()
        const iso2 = code.length === 3 ? ISO3_TO_2.get(code) ?? code : code

        return {
            code: iso2,
            name: country.name,
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
            pointFormat: `<b>{point.name}</b><br/><b>{point.value:,.0f}</b> ${props.valueLabel.toLowerCase()}`,
        },
    }), [chartData, props.valueLabel])

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
