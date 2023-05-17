export const RATING_CHART_CONFIG: Highcharts.Options = {
    title: {
        text: 'RATING HISTORY'
    },
    credits: {
        enabled: false
    },
    xAxis: {
        type: 'datetime',
        labels: {
            format: '{value:%Y-%m-%d}'
        }
    },
    yAxis: {
        title: {
            text: 'Rating'
        },
    },
    tooltip:
    {
        pointFormat: '{point.x:%Y-%m-%d}: {point.y:.0f}',
    },
    series: [{
        type: 'spline',
        name: 'SRM Rating'
    }]
}
