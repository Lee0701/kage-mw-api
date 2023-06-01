
const express = require('express')
const kage = require('./index').DEFAULT
const { Polygons } = require('@kurgm/kage-engine')

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/', (req, res) => {
    const name = req.body.name || ''
    const data = req.body.data || ''
    const content = req.body.content || ''
    const polygons = new Polygons()
    if(name) {
        kage.makeGlyph(polygons, name)
    } else if(data) {
        kage.kBuhin.push('temp', data)
        kage.makeGlyph(polygons, 'temp')
    } else if(content) {
        if(content.includes(':')) {
            kage.kBuhin.push('temp', content)
            kage.makeGlyph(polygons, 'temp')
        } else {
            kage.makeGlyph(polygons, content)
        }
    } else {
        res.status(400)
    }
    const result = polygons.generateSVG()
    res.send(result)
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})
