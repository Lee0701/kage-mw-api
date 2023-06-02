
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { Kage } = require('@kurgm/kage-engine')

const loadData = (kage, file) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({input: fs.createReadStream(file)})
    rl.on('line', (line) => {
        const entry = line.split(/[\|\t]/)
        if(entry.length != 3) return
        const [name, related, data] = entry.map((e) => e.trim())
        kage.kBuhin.push(name, data)
    })
    rl.on('close', () => resolve(kage))
})

const preprocessData = (name) => {
    return name.replace(/\@\d+/g, '')
}

const getDefault = async() => {
    const kage = new Kage()
    await Promise.all([
        // load(kage, path.join('data', 'dump_all_versions.txt')),
        loadData(kage, path.join('data', 'dump_newest_only.txt')),
    ])
    return kage
}

module.exports = {
    getDefault,
    loadData,
}
