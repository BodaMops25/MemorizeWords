const access_data = JSON.parse(localStorage.getItem('access-data') || '{}'),
      props = ['title', 'ADd%3C', 'Zv%3B%7B']

if(!access_data.integrationToken) access_data.integrationToken = prompt('Integration token not found, write new token here')
if(!access_data.databaseId) access_data.databaseId = prompt('Database id not found, write new id here')

localStorage.setItem('access-data', JSON.stringify(access_data))

const {integrationToken, databaseId} = access_data,
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
    itemsData[itemsData.length] = []
    const propsData = itemsData[itemsData.length - 1]

    for(const propId of props) propsData.push(
      await FM_makeFetch('https://api.notion.com/v1/pages/' + itm.id + '/properties/' + propId, {headers: NF_headers})
      .then(r => r.text())
      .then(r => {
        r = JSON.parse(r).results[0]
        return r ? r[r.type].text.content : ''
      })
    )
  }

  return itemsData
})
.then(console.log)