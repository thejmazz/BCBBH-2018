/*
 * This script demonstrates how to construct a raw data file from HGNC,
 * as well as populate ID fields from other sources (e.g. ensembl).
 * Everything is pulled down via JSON REST APIs.
 * It uses fetch, which means this code is (mostly) compatible in a browser environment.
 * (the writeTSV stuff will need some modification to work in browser, can write to string buffer)
 *
 * We can use it in a browser by either passing it through a bundler like webpack,
 * or using ES2015 modules which work in latest browsers.
 */

const fs = require('fs')

const hgnc = require('./hgnc.js')
const writeTSV = require('./writeTSV.js')

const { map: mapPromise } = require('bluebird')

async function fetchByHBNC_ID (hgnc_id) {
  const res = await hgnc.fetch('hgnc_id', hgnc_id)

  if (res.response.docs.length !== 1) {
    throw new Error('got multiple items from one hgnc_id')
  }

  return res.response.docs[0]
}

const xml2json = require('xml2json')

async function fetchByUniprot_ID (uniprot_id) {
  console.log(`starting fetch for ${uniprot_id}`)
  const res = await fetch(`https://www.uniprot.org/uniprot/${uniprot_id}.xml`)
      .then(res => res.text())
      .then(xml => xml2json.toJson(xml, { object: true }))

  console.log(`finishing fetch for ${uniprot_id}`)

  // console.log(JSON.stringify(res.uniprot.entry, null, 2))
  return res.uniprot.entry
}


// Populates uniprot comments into results
async function main () {
  const chr20 = await hgnc.search('location_sortable', '20*')

  await writeTSV(chr20.response.docs, './data/chr20-hgnc-IDs.tsv')

  // TODO pipeline of async functions each populating obj
  let fullData = await mapPromise(
    chr20.response.docs.slice(0, 20),
    obj => fetchByHBNC_ID(obj.hgnc_id),
    { concurrency: 5 }
  )

  // add 'interactions' from uniprot.dbReference[] where type is IntAct
  fullData = await mapPromise(
    fullData,
    (obj) => {
      if (obj.uniprot_ids) {
        return fetchByUniprot_ID(obj.uniprot_ids[0])
          .then((uniprot) => Object.assign(
            {},
            obj,
            Object.keys(uniprot).reduce((sum, key) => {
              if (key === 'dbReference') {
                let numInterations = -1
                uniprot[key].forEach(item => {
                  if (item.type === 'IntAct') {
                    numInterations = item.property.value
                  }
                })
                return Object.assign({}, sum, { interactions: numInterations })

                // if dumping everything in...
                // return Object.assign({}, sum, { [`uniprot-${key}`]: uniprot[key] })
              } else {
                return sum
              }
            }, {})
          ))
      } else {
        return obj
      }
    },
    { concurrency: 5 }
  )

  fs.writeFileSync('./data/data.json', JSON.stringify(fullData.map(i => i.interactions ? i.interactions : -1)))

  await writeTSV(fullData, './data/chr20.tsv')
}

main()
  .then(res => res ? console.log(res) : null)
  .catch(console.error)
