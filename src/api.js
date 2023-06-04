
require('dotenv').config()
const express = require('express')
const { getDefault } = require('./index')
const { Polygons } = require('@kurgm/kage-engine')
const { updatePage } = require('./update')
const { toInlineData, isAllAscii } = require('./functions')

const makeGlyphWithChar = (polygons, kage, char) => {
    kage.makeGlyph(polygons, 'u' + char.codePointAt(0).toString(16).padStart(4, '0'))
}

const makeGlyphWithName = (polygons, kage, name) => {
    kage.makeGlyph(polygons, name)
}

const makeGlyphWithData = (polygons, kage, data) => {
    kage.kBuhin.push('temp', toInlineData(data))
    kage.makeGlyph(polygons, 'temp')
}

const main = async () => {
    const kage = await getDefault()
    const app = express()

    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    app.post('/', (req, res) => {
        const char = req.body.char || ''
        const name = req.body.name || ''
        const data = req.body.data || ''
        const content = req.body.content || ''
        const polygons = new Polygons()
        if(char) makeGlyphWithData(polygons, kage, char)
        else if(name) makeGlyphWithName(polygons, kage, name)
        else if(data) makeGlyphWithData(polygons, kage, data)
        else if(content) {
            if(content.includes(':')) makeGlyphWithData(polygons, kage, content)
            else if(isAllAscii(content)) makeGlyphWithName(polygons, kage, content)
            else makeGlyphWithChar(polygons, kage, content)
        } else {
            res.status(400).send()
            return
        }
        const result = polygons.generateSVG()
        res.send(result)
    })

    app.get('/update', (req, res) => {
        const baseUrl = process.env.WIKI_URL
        const char = req.query.char || ''
        console.log(baseUrl, char)
        if(char) {
            updatePage(baseUrl, char)
            res.status(200).send('200')
        } else {
            res.status(400).send('400')
        }
    })

    app.listen(3000, () => {
        console.log('Listening on port 3000')
    })

}

if(require.main === module) {
    main()
}
