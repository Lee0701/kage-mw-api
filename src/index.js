
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { readTSVData, readJSONData } = require('./functions')
const { Kage } = require('@kurgm/kage-engine')

const dataFile = path.join('data', 'dump_newest_only.txt')
const customDataFile = path.join('data', 'wiki.tsv')
const indexDataFile = path.join('data', 'index.json')

const loadDataFile = (kage, file) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({input: fs.createReadStream(file)})
    rl.on('line', (line) => {
        const entry = line.split(/[\|\t]/)
        if(entry.length != 3) return
        const name = entry[0].trim().replace('\\@', '@')
        const data = entry[2].trim().replace('\@', '@').replace(/\@\d+/, '')
        kage.kBuhin.push(name, data)
    })
    rl.on('close', () => {
        resolve(kage)
    })
})

const loadCustomData = async (kage, data) => {
    Object.entries(data).forEach(([name, data]) => {
        kage.kBuhin.push(name, data)
    })
}

const loadCustomDataFile = async (kage, file) => {
    const data = fs.existsSync(file) ? readTSVData(file) : {}
    await loadCustomData(kage, data)
}

const loadIndexDataFile = async (file) => {
    const data = fs.existsSync(file)? readJSONData(file) : {}
    return data
}

const getDefault = async() => {
    const kage = new Kage()
    await Promise.all([
        // loadData(kage, path.join('data', 'dump_all_versions.txt')),
        loadDataFile(kage, dataFile),
        loadCustomDataFile(kage, customDataFile),
    ])
    return kage
}

module.exports = {
    getDefault,
    dataFile,
    customDataFile,
    indexDataFile,
    searchIndex,
    loadDataFile,
    loadCustomData,
    loadCustomDataFile,
    loadIndexDataFile,
}
