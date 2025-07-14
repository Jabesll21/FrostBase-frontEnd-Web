import { getTotals } from "./services.js"

var intervalData

export function init(){
    console.log('Initializing dashboard...')
    getData()
}

function getData() {
    var today = new Date()
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
    getTotals(date).then( (response) => {
        //Change values
        document.getElementById('label-backlog').textContent = response.backlog
        document.getElementById('label-process').textContent = response.process
        document.getElementById('label-completed').textContent = response.completed
        document.getElementById('label-alerts').textContent = response.alerts.value
        document.getElementById('label-above').textContent = response.above.value
        document.getElementById('label-below').textContent = response.below.value
        //Set colors
        //Calls in Queue
        document.getElementById('div-alerts').style.background = 'var(--' + response.alerts.status + ')'
        document.getElementById('icon-alerts').style.background = 'var(--' + response.alerts.status + ')'
        document.getElementById('value-alerts').style.background = 'var(--' + response.alerts.status + ')'
        document.getElementById('div-alerts-bottom').style.background = 'var(--' + response.alerts.status + 'Dark)'
        //Calls in Queue
        document.getElementById('div-above').style.background = 'var(--' + response.above.status + ')'
        document.getElementById('icon-above').style.background = 'var(--' + response.above.status + ')'
        document.getElementById('value-above').style.background = 'var(--' + response.above.status + ')'
        document.getElementById('div-above-bottom').style.background = 'var(--' + response.above.status + 'Dark)'
        //Calls in Queue
        document.getElementById('div-below').style.background = 'var(--' + response.below.status + ')'
        document.getElementById('icon-below').style.background = 'var(--' + response.below.status + ')'
        document.getElementById('value-below').style.background = 'var(--' + response.below.status + ')'
        document.getElementById('div-below-bottom').style.background = 'var(--' + response.below.status + 'Dark)'

        //Draw chart
        drawChart(response.records)
    })
    
    clearInterval(intervalData)
    intervalData = setInterval(getData, 10000)
}


//draw call duration chart
function drawChart(data) {
    console.log('Drawing charts...');

    Highcharts.chart('chart-alerts', Highcharts.merge(chartTheme, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Alerts (per day)'
        },
        xAxis: {
            categories: data.days
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total alerts'
            }
        },
        series: [
            {
                name: 'Alerts',
                data: data.totals,
                color: '#E0ECFD'
            }
        ]
    }));
}

const chartTheme = {
    chart: {
        backgroundColor: '#000030'
    },
    title: {
        style: { color: '#E0ECFD' }
    },
    subtitle: {
        style: { color: '#cccccc' }
    },
    xAxis: {
        labels: { style: { color: '#E0ECFD' } },
        lineColor: '#37474F',
        tickColor: '#37474F'
    },
    yAxis: {
        title: { style: { color: '#E0ECFD' } },
        labels: { style: { color: '#E0ECFD' } },
        gridLineColor: '#37474F'
    },
    legend: {
        itemStyle: { color: '#E0ECFD' }
    }
};