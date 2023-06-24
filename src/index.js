
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { readTSVData } = require('./functions')
const { Kage } = require('@kurgm/kage-engine')

const loadData = (kage, file) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({input: fs.createReadStream(file)})
    // const keys = []
    rl.on('line', (line) => {
        const entry = line.split(/[\|\t]/)
        if(entry.length != 3) return
        const name = entry[0].trim().replace('\\@', '@')
        const data = entry[2].trim().replace('\@', '@').replace(/\@\d+/, '')
        kage.kBuhin.push(name, data)
        // keys.push(name)
    })
    rl.on('close', () => {
        // const baseKeys = [...new Set(keys.map((key) => key.split('@')[0]))]
        // baseKeys.forEach((key) => {
        //     const latest = keys.filter((k) => k.split('@')[0] == key)
        //             .sort((a, b) => parseInt(b.split('@')[1]) - parseInt(a.split('@')[1]))[0]
        //     kage.kBuhin.push(key, kage.kBuhin.search(latest))
        // })
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
