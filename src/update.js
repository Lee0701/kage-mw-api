
require('dotenv').config()
const fs = require('fs')
const axios = require('axios')
const qs = require('qs')
const { normalizeTitle, toInlineData, readTSVData, writeTSVData, readJSONData, writeJSONData } = require('./functions')
const { customDataFile, customDataIndexFile } = require('./index')

const customData = fs.existsSync(customDataFile) ? readTSVData(customDataFile) : {}
const indexData = fs.existsSync(customDataIndexFile) ? readJSONData(customDataIndexFile) : {}
axios.defaults.paramsSerializer = (params) => qs.stringify(params)

const updateAllCharPages = async (baseUrl) => {
    const pages = await allPagesInNamespace(baseUrl, process.env.CHAR_NS_ID)
    console.info(`Updating all ${pages.length} char pages...`)
    for(const page of pages) {
        await updateCharPage(baseUrl, page)
    }
}

const updateAllExplainCharPages = async (baseUrl) => {
    const pages = await allPagesInNamespace(baseUrl, process.env.EXPLAIN_CHAR_NS_ID)
    console.info(`Updating all ${pages.length} explain pages...`)
    for(const page of pages) {
        await updateExplainCharPage(baseUrl, page)
    }
}

const allPagesInNamespace = async (baseUrl, namespace) => {
    const url = `${baseUrl}/api.php`
    const params = {
        format: 'json',
        action: 'query',
        list:'allpages',
        apnamespace: namespace,
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

const updateCharPage = async (baseUrl, title) => {
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

const updateExplainCharPage = async (baseUrl, title) => {
    const url = `${baseUrl}/api.php`
    const prefix = process.env.EXPLAIN_CHAR_CAT_PREFIX
    const page = `${title}`
    const params = {
        format: 'json',
        action: 'parse',
        page: page,
        prop: 'categories',
        redirects: true,
    }
    const response = await axios.get(url, {params})
    const parse = response.data.parse
    if(!parse) throw new Error(`Could not parse page ${page}`)
    const categories = parse.categories.map((cat) => cat['*'])
    const keywords = categories.map((name) => name.replace(prefix, ''))
    keywords.forEach((keyword) => indexData[keyword] = normalizeTitle(title))
    return indexData
}

const writeCustomData = (customData) => {
    writeTSVData(customDataFile, customData)
}

const writeIndexData = (indexData) => {
    writeJSONData(customDataIndexFile, indexData)
}

const main = async () => {
    const args = process.argv.slice(2)
    if(args.length >= 2) {
        [baseUrl, title] = args
        await updateCharPage(baseUrl, title)
        await updateExplainCharPage(baseUrl, title)
        writeCustomData(customData)
        writeIndexData(indexData)
    } else if(args.length >= 1) {
        [baseUrl] = args
        await updateAllCharPages(baseUrl)
        await updateAllExplainCharPages(baseUrl)
        writeCustomData(customData)
        writeIndexData(indexData)
    } else {
        baseUrl = process.env.WIKI_URL
        await updateAllCharPages(baseUrl)
        await updateAllExplainCharPages(baseUrl)
        writeCustomData(customData)
        writeIndexData(indexData)
    }
}

if(require.main === module) {
    main()
}

module.exports = {
    updateCharPage,
    updateExplainCharPage,
    updateAllCharPages,
    updateAllExplainCharPages,
    writeCustomData,
    writeIndexData,
}
