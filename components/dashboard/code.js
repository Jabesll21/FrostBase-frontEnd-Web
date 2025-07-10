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
        console.log(response)
        //Change values
        document.getElementById('label-active-sessions').textContent = response.activeSessions
        document.getElementById('label-active-calls').textContent = response.activeCalls
        document.getElementById('label-total-calls').textContent = response.totalCalls
        document.getElementById('label-avg-handle-time').textContent = response.averageHandleTime.value
        document.getElementById('label-wait-time').textContent = response.waitTime.value
        document.getElementById('label-calls-in-queue').textContent = response.callsInQueue.value
        //Set colors
        //Calls in Queue
        document.getElementById('div-avg-handle').style.background = 'var(--' + response.averageHandleTime.status + ')'
        document.getElementById('icon-avg-handle').style.background = 'var(--' + response.averageHandleTime.status + ')'
        document.getElementById('value-avg-handle').style.background = 'var(--' + response.averageHandleTime.status + ')'
        document.getElementById('div-avg-handle-bottom').style.background = 'var(--' + response.averageHandleTime.status + 'Dark)'
        //Calls in Queue
        document.getElementById('div-wait-time').style.background = 'var(--' + response.waitTime.status + ')'
        document.getElementById('icon-wait-time').style.background = 'var(--' + response.waitTime.status + ')'
        document.getElementById('value-wait-time').style.background = 'var(--' + response.waitTime.status + ')'
        document.getElementById('div-wait-time-bottom').style.background = 'var(--' + response.waitTime.status + 'Dark)'
        //Calls in Queue
        document.getElementById('div-calls-in-queue').style.background = 'var(--' + response.callsInQueue.status + ')'
        document.getElementById('icon-calls-in-call').style.background = 'var(--' + response.callsInQueue.status + ')'
        document.getElementById('value-calls-in-call').style.background = 'var(--' + response.callsInQueue.status + ')'
        document.getElementById('div-calls-in-queue-bottom').style.background = 'var(--' + response.callsInQueue.status + 'Dark)'

        //Draw chart
        drawChart(response)
    })
    
    clearInterval(intervalData)
    intervalData = setInterval(getData, 10000)
}


//draw call duration chart
function drawChart(data) {
    console.log('Drawing charts...');
    Highcharts.chart('chart-duration', Highcharts.merge(darkTheme, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Call Duration (by minute)'
        },
        subtitle: {
            text: data.date
        },
        xAxis: {
            categories: data.duration.minutes
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total calls'
            }
        },
        series: [
            {
                name: 'Calls',
                data: data.duration.totals,
                color: '#FFF'
            }
        ]
    }));
    Highcharts.chart('chart-hour', Highcharts.merge(darkTheme, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Call Volume (By hour)'
        },
        subtitle: {
            text: data.date
        },
        xAxis: {
            categories: data.totals.hour
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total calls'
            }
        },
        series: [
            {
                name: 'Calls',
                data: data.totals.totals,
                color: '#FFF'
            }
        ]
    })); 
}

const darkTheme = {
    chart: {
        backgroundColor: '#293a42'
    },
    title: {
        style: { color: '#ffffff' }
    },
    subtitle: {
        style: { color: '#cccccc' }
    },
    xAxis: {
        labels: { style: { color: '#ffffff' } },
        lineColor: '#37474F',
        tickColor: '#37474F'
    },
    yAxis: {
        title: { style: { color: '#ffffff' } },
        labels: { style: { color: '#ffffff' } },
        gridLineColor: '#37474F'
    },
    legend: {
        itemStyle: { color: '#ffffff' }
    }
};