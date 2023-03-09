
const express = require('express')
const bodyParser = require('body-parser')
const {convert, group, stringify} = require('./index')

const parseFormat = (str) => {
    return (hanja, reading) => {
        return str.toLowerCase()
                .replace(/\{(hanja|h)\}/g, hanja)
                .replace(/\{(reading|r)\}/g, reading)
    }
}

const app = express()

app.use(bodyParser.json({limit: '10mb'}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

app.post('/', (req, res) => {
    const format = parseFormat(req.body.format || '{r}')
    const converted = convert(req.body.text || '')
    const grouped = ((req.body.group || '').toString() == 'true') ? group(converted) : converted
    const stringified = ((req.body.stringify || '').toString() == 'true') ? stringify(grouped, format) : grouped
    const result = {result: stringified}
    res.send(JSON.stringify(result))
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})
