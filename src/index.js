
const fs = require('fs')
const path = require('path')
const { Kage } = require('@kurgm/kage-engine')

const loadTsv = (file) => {
    const glypheme = Object.fromEntries(fs.readFileSync(file, 'utf8').split('\n')
            .map((line) => line.split('\t'))
            .filter((entry) => entry.length == 2)
            .map(([name, data]) => [name, preprocessData(data)]))
    const decompose = {}
    return { glypheme, decompose }
}

const preprocessData = (name) => {
    return name.replace(/\@\d+/g, '')
}

const loadRaw = (file) => {
    const content = fs.readFileSync(file, 'utf8')
    const glypheme = content.split('\n').map((line) => line.split('|'))
            .filter((entry) => entry.length == 3)
            .map(([name, related, data]) => [name.trim(), data.trim()])
    const decompose = {}
    return { glypheme, decompose }
}

const DEFAULT = new Kage()
const { glypheme } = loadRaw(path.join('data', 'dump_newest_only.txt'))
glypheme.forEach(([name, data]) => DEFAULT.kBuhin.push(name, data))

module.exports = {
    DEFAULT,
    loadTsv,
    loadRaw,
}
