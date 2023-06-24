
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const qs = require('qs')
const { normalizeTitle, toInlineData, readTSVData, writeTSVData } = require('./functions')

const dataFile = path.join('data', 'wiki.tsv')
const data = fs.existsSync(dataFile) ? readTSVData(dataFile) : {}
axios.defaults.paramsSerializer = (params) => qs.stringify(params)

const updateAllPages = async (baseUrl) => {
    const pages = await allCharPages(baseUrl)
    console.info(`Updating all ${pages.length} pages...`)
    for(const page of pages) {
        await updatePage(baseUrl, page)
    }
}

const allCharPages = async (baseUrl) => {
    const url = `${baseUrl}/api.php`
    const params = {
        format: 'json',
        action: 'query',
        list:'allpages',
        apnamespace: 3000,
        apcontinue: '',
    }
    const data = []
    while(true) {
        const response = await axios.get(url, {params})
        const allpages = response.data.query.allpages
        if(!allpages) break
        data.push(...allpages.map((p) => p.title))
        const cont = response.data.continue
        if(cont && cont.apcontinue) {
            params.apcontinue = cont.apcontinue
        } else break
    }
    return data
}

const updatePage = async (baseUrl, title) => {
    const url = `${baseUrl}/api.php`
    const page = `漢字:${title}`
    const params = {
        format: 'json',
        action: 'parse',
        page: page,
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
        await updatePage(baseUrl, title)
    } else if(args.length >= 1) {
        [baseUrl] = args
        await updateAllPages(baseUrl)
    } else {
        baseUrl = process.env.WIKI_URL
        await updateAllPages(baseUrl)
    }
}

if(require.main === module) {
    main()
}

module.exports = {
    updatePage,
    updateAllPages,
}
