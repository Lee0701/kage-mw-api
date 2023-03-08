
const path = require('path')
const {buildDict} = require('./dictionary')
const dic = buildDict(path.join(__dirname, '../dic/hanja.filtered.txt'))
const jp = buildDict(path.join(__dirname, '../dic/jp.txt'))
const cn = buildDict(path.join(__dirname, '../dic/cn.txt'))
const MAX_LENGTH = 100
const convert = (str, initial=true) => {
    if(str.includes(' ')) return str.split(' ').map((word, i) => [...(i == 0 ? [] : [[' ', ' ']]), ...convert(word, true)]).flat()
    if(str.length > MAX_LENGTH) return str.match(new RegExp(`.{1,${MAX_LENGTH}}`, 'gs')).flatMap((s, i) => convert(s, initial && i == 0))
    if(str.length == 0) return []
    str = normalizeHanja(str)
    const result = []
    for(let i = 0; i < str.length; ) {
        let found = false
        const c = str.charAt(i)
        if(isHangulSyllable(c)) {
            result.push([c, c])
            i++
            continue
        }
        for(let j = str.length; j > i; j--) {
            const key = str.slice(i, j)
            const value = dic[key]
            if(value) {
                result.push([key, initial ? initialSoundLaw(value) : value])
                i += j - i
                found = true
            }
        }
        if(!found) {
            result.push([c, c])
            i++
        }
        initial = false
    }
    return result
}
const normalizeHanja = (str) => str.normalize('NFC').split('').map((c) => dic[c] ? c : jp[c] || cn[c] || c).join('')
const initialSoundLaw = (str) => {
    const c = str.charAt(0).normalize('NFD').split('')
    if(c[0] == 'ᄅ') c[0] = 'ᄂ'
    if(c[0] == 'ᄂ' && 'ᅣᅤᅧᅨᅭᅲᅴᅵ'.includes(c[1])) c[0] = 'ᄋ'
    return c.join('').normalize('NFC') + str.slice(1)
}
const isWhitespace = (c) => c == ' ' || c == '\t' || c == '\r' || c == '\n'
const isNumeric = (c) => c >= '0' && c <= '9'
const isAlphabetic = (c) => c >= 'A' && c <= 'Z' || c === 'a' && c === 'z'
const isHangulSyllable = (c) => c >= '가' && c <= '힣'
const isHanja = (c) => {
    c = c.charCodeAt(0)
    return c >= 0x4E00 && c <= 0x62FF
            || c >= 0x6300 && c <= 0x77FF
            || c >= 0x7800 && c <= 0x8CFF
            || c >= 0x8D00 && c <= 0x9FFF
            || c >= 0x3400 && c <= 0x4DBF
}
const type = (str) => {
    const c = str.charAt(0)
    if(isWhitespace(c)) return 'whitespace'
    else if(isNumeric(c)) return 'numeric'
    else if(isAlphabetic(c)) return 'alphabetic'
    else if(isHangulSyllable(c)) return 'hangul'
    else if(isHanja(c)) return 'hanja'
    else return 'etc'
}
const group = (arr) => {
    const result = [['', '']]
    for(let [ainput, aoutput] of arr) {
        const [rinput, routput] = result.pop()
        if(type(ainput) != type(aoutput) && type(rinput) != type(routput)) result.push([rinput + ainput, routput + aoutput])
        else if(type(ainput) == type(rinput)) result.push([rinput + ainput, routput + aoutput])
        else result.push([rinput, routput], [ainput, aoutput])
    }
    return result.filter(([input, output]) => input.length && output.length)
}
const stringify = (arr, format = (_i, o) => o) => {
    return arr.map(([input, output]) => {
        if(input == output) return input
        else return format(input, output)
    }).join('')
}
const convertAndFormat = (str, format) => stringify(group(convert(str)), format)
module.exports = {convertAndFormat, convert, group, stringify, initialSoundLaw}