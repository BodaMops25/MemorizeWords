const {integrationToken, databaseId} = ls_access_data,
      NF_headers = {
        'Authorization': 'Bearer ' + integrationToken,
        'Notion-Version': '2022-06-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }

async function getItems(cursor) {
  const r = await FM_makeFetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
    method: 'POST',
    headers: NF_headers,
    body: JSON.stringify({start_cursor: cursor})
  })
  .then(r => r.text())
  .then(JSON.parse)

  return r.next_cursor ? r.results.concat(await getItems(r.next_cursor)) : r.results
}

const itemsData = []

getItems().then(async arr => {

  for(const itm of arr) {
    itemsData[itemsData.length] = {}
    const propsData = itemsData[itemsData.length - 1]

    for(const key in ls_props) {
      propsData[key] = await FM_makeFetch('https://api.notion.com/v1/pages/' + itm.id + '/properties/' + ls_props[key], {headers: NF_headers})
      .then(r => r.text())
      .then(r => {
        r = JSON.parse(r).results[0]
        return r ? r[r.type].text.content : ''
      })
    }
  }

  return itemsData
})
.then(r => console.log('Receive data finished:', r), err => console.log(err))