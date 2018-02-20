// Built-in
const qs = require('querystring')

// From NPM
const fetch = require('isomorphic-fetch')
// set DEBUG=* or DEBUG=HGNC before running script
const debug = require('debug')('fetch')

// HGNC API
const fetchHGNC = (path) => {
  const HGNC_BASE_URL = 'https://rest.genenames.org'

  const url = HGNC_BASE_URL + path
  debug(`attempting GET ${url}`)

  return fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  }).then(res => {
    debug(`response from ${url}`)
    // TODO need to handle non-200 responses and provider proper error message
    // assumes it works and gives back json
    // NOTE fetch() is nice b/c native to browsers, BUT gotta do this manual work...
    return res.json()
  })
}

const hgnc = {
  search(field, query) {
    return fetchHGNC(`/search/${qs.escape(field)}/${qs.escape(query)}`)
  },
  fetch(field, query) {
    return fetchHGNC(`/fetch/${qs.escape(field)}/${qs.escape(query)}`)
  }
}

module.exports = hgnc
