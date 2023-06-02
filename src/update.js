
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const qs = require('qs')
const { normalizeTitle, toInlineData, readTSVData, writeTSVData } = require('./functions')

const dataFile = path.join('data', 'wiki.tsv')
const data = fs.existsSync(dataFile) ? readTSVData(dataFile) : {}

axios.defaults.paramsSerializer = (params) => qs.stringify(params)

const update = async (baseUrl, title) => {
    const url = `${baseUrl}/api.php`
    const params = {
        format: 'json',
        action: 'parse',
        page: title,
        prop: 'wikitext',
        redirects: true,
    }
    const response = await axios.get(url, {params})
    const parse = response.data.parse
    if(!parse) return

    const text = parse.wikitext['*']
    if(text.includes('<kage>') && text.includes('</kage>')) {
        const t = normalizeTitle(title)
        const d = toInlineData(text.slice(text.indexOf('<kage>') + 6, text.indexOf('</kage')))
        data[t] = d
        writeTSVData(dataFile, data)
    }
}

const main = async () => {
    const args = process.argv.slice(2)
    if(args.length >= 2) {
        [baseUrl, title] = args
        await update(baseUrl, title)
    }
}

if(require.main === module) {
    main()
}

module.exports = {
    update,
}
