// quick script to convert from the airtable records format to a json array
// take care; this writes over cleaned.json
//
// See the instructions in README.md for how to curl airtable for the
// download.json
let fs = require('fs')

let raw = JSON.parse(fs.readFileSync('download.json'))
let converted = raw.records.map(obj => ({id: obj.id, ...obj.fields}))
fs.writeFileSync('cleaned.json', JSON.stringify(converted, null, 2))

console.log(`Converted ${converted.length} records from download.json, written to cleaned.json`)
