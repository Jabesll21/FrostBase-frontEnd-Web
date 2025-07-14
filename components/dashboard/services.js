import { config } from '../../js/config.js'

//TEST totals
export async function getTotals(date) {
    const totals = {
        backlog: 14,
        process: 80,
        completed: 20,
        alerts: {
            value: 9,
            status: "extreme",
        },
        above: {
            value: "5/20",
            status: "high"
        },
        below: {
            value: "1/20",
            status: "low"
        },
        records: {
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            totals: [3,5,2,8,4,5,10]
        }
    }
    console.log(totals)
    //fetch
    return totals
}

// //GET totals
// export async function getTotals(date) {
//     //url
//     var url = config.api.url + "truck/totals/" + date
//     console.log(url)
//     //fetch
//     return await fetch(url)
//         .then( (result) => { return result.json() })
//         .catch( (error) => { console.log(error) })
// }
