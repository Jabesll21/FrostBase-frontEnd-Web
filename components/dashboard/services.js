import { config } from '../../js/config.js'

//get totals
export async function getTotals(date) {
    //url
    var url = config.api.url + "call/totals/" + date
    console.log(url)
    //fetch
    return await fetch(url)
        .then( (result) => { return result.json() })
        .catch( (error) => { console.log(error) })
}
