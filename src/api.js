
const express = require('express')
const { getDefault } = require('./index')
const { Polygons } = require('@kurgm/kage-engine')

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
        if(char) {
            kage.makeGlyph(polygons, 'u' + char.codePointAt(0).toString(16).padStart(4, '0'))
        } else if(name) {
            kage.makeGlyph(polygons, name)
        } else if(data) {
            kage.kBuhin.push('temp', data)
            kage.makeGlyph(polygons, 'temp')
        } else if(content) {
            if(content.includes(':')) {
                kage.kBuhin.push('temp', content)
                kage.makeGlyph(polygons, 'temp')
            } else if(content.split('').filter((c) => !(c >= '!' && c <= '~')).length) {
                kage.makeGlyph(polygons, 'u' + content.codePointAt(0).toString(16).padStart(4, '0'))
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

}

if(require.main === module) {
    main()
}
