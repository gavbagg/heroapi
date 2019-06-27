import express from 'express';
import bodyParser from 'body-parser';
import functionhandlers from './processing/process-events'

const app = express();

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
});

//accept post request for processing events
app.post('/api/v1/processevents', (req, res) => {
    const body = req.body

    functionhandlers.processEvents(body)

    return res.status(201).send({
        success: 'true'
    })
})

app.get('/api/v1/getsummary', (req, res) => {
    const merchantid = req.query.merchantid

    const summary = functionhandlers.returnSummaryOfEvents(merchantid)

    return res.status(200).send({
        success: 'true',
        summary
    })
})

app.get('/api/v1/listallevents', (req, res) => {
    const merchantid = req.query.merchantid

    const events = functionhandlers.listAllEvents(merchantid)

    return res.status(200).send({
        success: 'true',
        events
    })
})