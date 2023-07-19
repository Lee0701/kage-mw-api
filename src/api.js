
require('dotenv').config()
const express = require('express')
const { getDefault, loadCustomData } = require('./index')
const { Polygons } = require('@kurgm/kage-engine')
const sharp = require('sharp')
const { updatePage, writeCustomData } = require('./update')
const { toInlineData, isAllAscii, nonAsciiCharToAscii } = require('./functions')

const makeGlyphWithChar = (polygons, kage, char) => {
    kage.makeGlyph(polygons, 'u' + char.codePointAt(0).toString(16).padStart(4, '0'))
}

const makeGlyphWithName = (polygons, kage, name) => {
    kage.makeGlyph(polygons, name)
}

const preprocessData = (data) => {
    data = data.split('').map((c) => nonAsciiCharToAscii(c)).join('')
    return data
}

const makeGlyphWithData = (polygons, kage, data) => {
    data = preprocessData(data)
    data = toInlineData(data)
    kage.kBuhin.push('temp', data)
    kage.makeGlyph(polygons, 'temp')
}

const postProcess = (alt, str) => {
    const classNames = 'kage'
    alt = alt.trim().split('\n').map((line) => line.trim()).join('$')
    if(str.startsWith('<svg')) str = str.replace('<svg', `<svg class="${classNames}" alt="${alt}"`)
    else if(str.startsWith('<img')) str = str.replace('<img', `<img class="${classNames}" alt="${alt}"`)
    str = str.trim()
    return str
}

const main = async () => {
    const kage = await getDefault()
    const app = express()

    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    app.post('/', async (req, res) => {
        const char = req.body.char || ''
        const name = req.body.name || ''
        const data = req.body.data || ''
        const content = req.body.content || ''
        const format = req.body.format || 'png'
        const polygons = new Polygons()
        if(char) makeGlyphWithChar(polygons, kage, char)
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

        const svg = polygons.generateSVG()
        const alt = char || name || data || content

        if(format == 'png') {
            const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
            const uri = 'data:image/png;base64,' + buffer.toString('base64')
            const img = `<img src="${uri}"/>`
            const result = postProcess(alt, img)
            res.send(result)
        } else {
            const result = postProcess(alt, svg)
            res.send(result)
        }
    })

    app.get('/update', async (req, res) => {
        const baseUrl = process.env.WIKI_URL
        const namespace = process.env.CHAR_NS_NAME
        const char = req.query.char || ''
        console.log('update', char)
        if(char) {
            const title = `${namespace}:${char}`
            const customData = await updatePage(baseUrl, title)
            res.status(200).send('200')
            loadCustomData(kage, customData)
            writeCustomData(customData)
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
