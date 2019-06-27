const axios = require('axios');
import db from '../db/db';

//fetch product info and store in map of maps 
const processEvents = async(events) => {
    for (let i = 0; i < events.length; i++) {
        let currentEvent = events[i]
        if (!db.has(currentEvent.merchant)) {
            let merchantMap = new Map()
            merchantMap.set('product-view', [])
            merchantMap.set('transaction', [])

            db.set(currentEvent.merchant, merchantMap)
        }
        if (currentEvent.type == 'product-view') {
            currentEvent = await processProductView(currentEvent)
                .catch((err) => {
                    console.log(err)
                })
            let productViewArray = db.get(currentEvent.merchant).get('product-view')
            productViewArray.push(currentEvent)
            db.get(currentEvent.merchant).set('product-view', productViewArray)
        } else if (currentEvent.type == 'transaction') {
            currentEvent = await processTransaction(currentEvent)
                .catch((err) => {
                    console.log(err)
                })
            let transactionArray = db.get(currentEvent.merchant).get('transaction')
            transactionArray.push(currentEvent)
            db.get(currentEvent.merchant).set('transaction', transactionArray)
        } else {
            //handle wrong event type
        }
    }

}

const returnSummaryOfEvents = (merchantID) => {

    if (!db.has(merchantID)) {
        return "no events for this merchant"
    }
    let merchantsEvents = db.get(merchantID)
    let total_events = 0
    let number_of_customers = 0
    let events_summary = []

    const prepareEventsSummary = (eventArray, eventType, map) => {
        let distinctCustomers = [...new Set(merchantsEvents.get(eventType).map(x => x.user))]
        let eventTypeInfo
        if (eventType == "transaction") {
            let totalval = eventArray.reduce((runningTotal, currentTransaction) => {
                return runningTotal + currentTransaction.data.transaction.total
            }, 0)
            eventTypeInfo = {
                "type": eventType,
                "total_events": eventArray.length,
                "number_of_customers": distinctCustomers.length,
                "total_value": totalval
            }
        } else {
            eventTypeInfo = {
                "type": eventType,
                "total_events": eventArray.length,
                "number_of_customers": distinctCustomers.length
            }
        }

        total_events += eventArray.length
        number_of_customers += distinctCustomers.length
        events_summary.push(eventTypeInfo)
    }



    merchantsEvents.forEach(prepareEventsSummary)
    let summary = {
        "total_events": total_events,
        "number_of_customers": number_of_customers,
        "events_summary": events_summary
    }
    return summary

}

const listAllEvents = (merchantID) => {
    if (!db.has(merchantID)) {
        return "no events for this merchant"
    }
    let allEvents = []
    let merchantsEvents = db.get(merchantID)
    merchantsEvents.forEach((value, key) => {
        console.log(value)
        allEvents = allEvents.concat(value)
    })

    console.log("allevents")
    console.log(allEvents)

    return allEvents
}

const processProductView = async(event) => {
    let merchantID = event.merchant
    let sku = event.data.product.sku_code
    event.data.product.productInfo = await getProductInfo(merchantID, sku)
    return event

}

const processTransaction = async(event) => {
    let merchantID = event.merchant
    let line_items = event.data.transaction.line_items

    for (let i = 0; i < line_items.length; i++) {
        let sku = line_items[i].product.sku_code
        line_items[i].product.productInfo = await getProductInfo(merchantID, sku)
            .catch((err) => {
                console.log(err)
            })
    }

    return event

}

const getProductInfo = async(merchantID, sku) => {

    console.log(`curl -X GET "https://qa.backend.usehero.com/products/v3/${sku}" -H "x-hero-merchant-id: ${merchantID}"`)
    const response = await axios({
            method: 'get',
            url: `https://qa.backend.usehero.com/products/v3/${sku}`,
            headers: {
                'x-hero-merchant-id': merchantID
            }
        })
        .catch((err) => {
            console.log(err)
        })

    return response.data == '' ? "product info unavailable" : response.data

}

export default {
    processEvents: processEvents,
    returnSummaryOfEvents: returnSummaryOfEvents,
    listAllEvents: listAllEvents
}