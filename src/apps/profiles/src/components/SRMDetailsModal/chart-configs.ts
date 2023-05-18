export const RATING_CHART_CONFIG: Highcharts.Options = {
    credits: {
        enabled: false,
    },
    series: [{
        name: 'SRM Rating',
        type: 'spline',
    }],
    title: {
        text: 'RATING HISTORY',
    },
    tooltip: {
        pointFormat: '{point.x:%Y-%m-%d}: {point.y:.0f}',
    },
    xAxis: {
        labels: {
            format: '{value:%Y-%m-%d}',
        },
        type: 'datetime',
    },
    yAxis: {
        title: {
            text: 'Rating',
        },
    },
}

export const RATING_DISTRO_CHART_CONFIG: Highcharts.Options = {
    chart: {
        type: 'column',
    },
    credits: {
        enabled: false,
    },
    legend: {
        enabled: false,
    },
    title: {
        text: 'RATING DISTRIBUTION',
    },
    tooltip: {
        pointFormat: '{series.name:.0f}: {point.y:.0f} Coders',
    },
    xAxis: {
        visible: false,
    },
    yAxis: {
        title: {
            text: 'Rating',
        },
    },
}
