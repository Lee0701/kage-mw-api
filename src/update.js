
require('dotenv').config()
const fs = require('fs')
const axios = require('axios')
const qs = require('qs')
const { normalizeTitle, toInlineData, readTSVData, writeTSVData } = require('./functions')
const { customDataFile } = require('./index')

const customData = fs.existsSync(customDataFile) ? readTSVData(customDataFile) : {}
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
        apnamespace: process.env.CHAR_NS_ID,
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
    const page = `${title}`
    const params = {
        format: 'json',
        action: 'parse',
        page: page,
        prop: 'wikitext',
        redirects: true,
    }
    const response = await axios.get(url, {params})
    const parse = response.data.parse
    if(!parse) throw new Error(`Could not parse page ${page}`)

    const text = parse.wikitext['*']
    if(text.includes('<kage>') && text.includes('</kage>')) {
        const t = normalizeTitle(title)
        const content = text.slice(text.indexOf('<kage>') + 6, text.indexOf('</kage>'))
        const d = toInlineData(content)
        customData[t] = d
    }
    return customData
}

const writeCustomData = (customData) => {
    writeTSVData(customDataFile, customData)
}

const main = async () => {
    const args = process.argv.slice(2)
    if(args.length >= 2) {
        [baseUrl, title] = args
        await updatePage(baseUrl, title)
        writeCustomData(customData)
    } else if(args.length >= 1) {
        [baseUrl] = args
        await updateAllPages(baseUrl)
        writeCustomData(customData)
    } else {
        baseUrl = process.env.WIKI_URL
        await updateAllPages(baseUrl)
        writeCustomData(customData)
    }
}

if(require.main === module) {
    main()
}

module.exports = {
    updatePage,
    updateAllPages,
    writeCustomData,
}
