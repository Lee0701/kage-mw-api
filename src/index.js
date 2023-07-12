
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { readTSVData } = require('./functions')
const { Kage } = require('@kurgm/kage-engine')

const loadData = (kage, file) => new Promise((resolve, reject) => {
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

const readCustomData = async (kage, file) => {
    const data = fs.existsSync(file) ? readTSVData(file) : {}
    Object.entries(data).forEach(([name, data]) => {
        kage.kBuhin.push(name, data)
    })
}

const getDefault = async() => {
    const kage = new Kage()
    await Promise.all([
        // loadData(kage, path.join('data', 'dump_all_versions.txt')),
        loadData(kage, path.join('data', 'dump_newest_only.txt')),
        readCustomData(kage, path.join('data', 'wiki.tsv')),
    ])
    return kage
}

module.exports = {
    getDefault,
    loadData,
}
