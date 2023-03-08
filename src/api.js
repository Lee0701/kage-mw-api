
const express = require('express')
const bodyParser = require('body-parser')
const {convertHanjaReading} = require('./index')

const parseFormat = (str) => {
    return (hanja, reading) => {
        return str.toLowerCase()
                .replace(/\{(hanja|h)\}/g, hanja)
                .replace(/\{(reading|r)\}/g, reading)
    }
}

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.post('/', (req, res) => {
    const format = parseFormat(req.body.format || 'r')
    const text = convertHanjaReading(req.body.text || '', format)
    const result = {text}
    res.send(JSON.stringify(result))
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})
