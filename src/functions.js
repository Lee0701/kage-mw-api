
const fs = require('fs')

const isAscii = (c) => c >= '\0' && c <= '~'
const isAllAscii = (str) => str.split('').filter((c) => !isAscii(c)).length == 0
const charToAscii = (c) => 'u' + c.codePointAt(0).toString(16).padStart(4, '0')
const nonAsciiCharToAscii = (c) => isAscii(c) ? c : charToAscii(c)

const toInlineData = (data) => data.split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length)
        .map((line) => normalizeLine(line))
        .join('$')

const toMultilineData = (data) => data.split('$').join('\n')

const readTSVData = (fileName) => {
    const entries = fs.readFileSync(fileName, 'utf8').split('\n')
            .filter((line) => line.trim())
            .map((line) => line.split('\t'))
            .map((entry) => entry.map((item) => item.trim()))
            .map(([key, related, value]) => [key, value])
    return Object.fromEntries(entries)
}

const writeTSVData = (fileName, data) => {
    const entries = Object.entries(data)
    const result = entries.map(([key, value]) => `${key}\t\t${value}`).join('\n')
    fs.writeFileSync(fileName, result)
}

const normalizeTitle = (title) => {
    const parts = title.split(':')
    const namespace = parts.length >= 2 ? parts.shift() : ''
    const name = parts[0]
    if(isAllAscii(name)) return name
    return name.split('').map((c) => isAscii(c) ? c : charToAscii(c)).join('-')
}

const normalizeLine = (line) => {
    const parts = line.split(':')
    return [...parts.slice(0, 7), normalizeTitle(parts[7] || ''), ...parts.slice(8)].join(':')
}

module.exports = {
    isAscii,
    isAllAscii,
    charToAscii,
    nonAsciiCharToAscii,
    normalizeTitle,
    toInlineData,
    toMultilineData,
    readTSVData,
    writeTSVData,
}
