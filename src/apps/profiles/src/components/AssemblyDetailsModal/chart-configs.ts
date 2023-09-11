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
