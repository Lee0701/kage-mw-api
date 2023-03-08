
const path = require('path')
const {buildDict} = require('./dictionary')
const dic = buildDict(path.join(__dirname, '../dic/hanja.filtered.txt'))
const jp = buildDict(path.join(__dirname, '../dic/jp.txt'))
const cn = buildDict(path.join(__dirname, '../dic/cn.txt'))
const MAX_LENGTH = 100
const convertHanjaReading = (str, formatResult = (_hanja, reading) => reading, initial=true) => {
    if(str.includes(' ')) return str.split(' ').map((word) => convertHanjaReading(word, formatResult, true)).join(' ')
    if(str.length > MAX_LENGTH) return str.match(new RegExp(`.{1,${MAX_LENGTH}}`, 'gs')).map((s, i) => convertHanjaReading(s, formatResult, initial && i == 0)).join('')
    if(str.length == 0) return str
    str = normalizeHanja(str)
    let result = ''
    for(let i = 0; i < str.length; ) {
        let found = false
        const c = str.charAt(i)
        if(c >= '가' && c <= '힣') {
            result += c
            i++
            continue
        }
        for(let j = str.length; j > i; j--) {
            const key = str.slice(i, j)
            const value = dic[key]
            console.log(key, value)
            if(value) {
                result += initial ? initialSoundLaw(value) : value
                i += j - i
                found = true
            }
        }
        if(!found) {
            result += c
            i++
        }
        initial = false
    }
    const groups = groupResult(str, result)
    return groups.map(([output, input]) => {
        if(output == input) return input
        else return formatResult(output, input)
    }).join('')
}
const normalizeHanja = (str) => str.normalize('NFC').split('').map((c) => dic[c] ? c : jp[c] || cn[c] || c).join('')
const initialSoundLaw = (str) => {
    const c = str.charAt(0).normalize('NFD').split('')
    if(c[0] == 'ᄅ') c[0] = 'ᄂ'
    if(c[0] == 'ᄂ' && 'ᅣᅤᅧᅨᅭᅲᅴᅵ'.includes(c[1])) c[0] = 'ᄋ'
    return c.join('').normalize('NFC') + str.slice(1)
}
const groupResult = (output, input) => {
    const result = [['', '']]
    for(let i = 0; i < input.length; i++) {
        const cout = output.charAt(i)
        const cin = input.charAt(i)
        const [lastOut, lastIn] = result.pop()
        if(cout != cin) {
            result.push([lastOut + cout, lastIn + cin])
        } else {
            if(lastOut.length && lastIn.length) result.push([lastOut, lastIn])
            result.push([cout, cin])
            result.push(['', ''])
        }
    }
    return result
}
module.exports = {convertHanjaReading, initialSoundLaw}