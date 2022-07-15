const {integrationToken, databaseId} = ls_access_data,
      NF_headers = {
        'Authorization': 'Bearer ' + integrationToken,
        'Notion-Version': '2022-06-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }

async function getItems(amount, cursor) {
  const r = await FM_makeFetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
    method: 'POST',
    headers: NF_headers,
    body: JSON.stringify({start_cursor: cursor, page_size: amount})
  })
  .then(r => r.text())
  .then(JSON.parse)

  if(r.next_cursor && !amount) return r.results.concat(await getItems(undefined, r.next_cursor))
  return r.next_cursor && amount > 100 ? r.results.concat(await getItems(amount - 100, r.next_cursor)) : r.results
}

const words = [],
      wordsPromise = getItems(5).then(async arr => {

  for(const itm of arr) {
    words[words.length] = {}
    const propsData = words[words.length - 1]

    for(const key in ls_props) {
      propsData[key] = await FM_makeFetch('https://api.notion.com/v1/pages/' + itm.id + '/properties/' + ls_props[key], {headers: NF_headers})
      .then(r => r.text())
      .then(r => {
        r = JSON.parse(r)
        if(r.type !== 'date') {
          r = r.results[0]
          return r ? r[r.type].text.content : ''
        }
        return r.date
      })
    }
    if(propsData.data) {
      propsData.data = JSON.parse(propsData.data)
      propsData.data.invokeDate = new Date(propsData.data.invokeDate)
    }
    propsData.id = itm.id
  }

  return words
})
.then(r => {
  console.log('Receive data finished:', r)
  return r
}, err => console.log('Error geting items from notion database:', err))

// ASYNC QUEUE

const asyncQueue = {
  queue: [],
  isProcessed: false,
  addItem(asyncFunc, params = []) {
    this.queue.push([asyncFunc, params])
    if(!this.isProcessed) this.processQueue()
  },
  async processQueue() {
    this.isProcessed = true
    const [asyFunc, params] = this.queue.pop()
    await asyFunc(...params)
    if(this.queue.length) await this.processQueue()
    this.isProcessed = false
  }
}

// WORDS

const nodes = {
  mainBlock: getNode('fieldset.word-content'),
  word: getNode('h3.word-title'),
  checkSpelling: {
    input: getNode('input#check_spelling'),
    checkButton: getNode('button.check-spelling')
  },
  wordVariants: {
    fields: [1, 2, 3, 4].map(itm => {
      return {
        checkbox: getNode('input#word_radio_' + itm),
        label: getNode('label[for="word_radio_' + itm + '"]')
      }
    }),
    checkButton: getNode('button.check-word-variants')
  },
  memorizeQuality: getNode('input#memorize_quality'),
  saveNext: getNode('.save-next')
}

function setWord(wordsArr, num) {
  if(!wordsArr[num]) {
    console.log('Item not exist!')
    return
  }
  
  const word = wordsArr[num]

  nodes.word.innerText = word.eng
  nodes.checkSpelling.checkButton.onclick = () => {
    const inWord = nodes.checkSpelling.input.value,
          controlWord = word.title

    // NEED MAKE NORMAL FUNCTION OF EQUALATION WORDS
    if(controlWord.toLowerCase().replace('en ', '').replace('ett ', '') === inWord.toLowerCase()) {
      alert('ok')
      nodes.memorizeQuality.value = 3
    }
    else {
      alert('not ok')
      nodes.memorizeQuality.value = 2
    }
  }

  nodes.wordVariants.fields.forEach(({checkbox, label}) => {
    checkbox.value = false
    label.innerText = wordsArr[Math.floor(Math.random()*wordsArr.length)].title
  })

  const {checkbox, label} = nodes.wordVariants.fields[Math.floor(Math.random()*nodes.wordVariants.fields.length)]
  checkbox.value = true
  label.innerText = word.title

  nodes.wordVariants.checkButton.onclick = () => {
    if(JSON.parse(nodes.wordVariants.fields.find(itm => itm.checkbox.checked)?.checkbox.value || 'false')) {
      alert('ok')
      if(nodes.memorizeQuality.value < 2) nodes.memorizeQuality.value = 2
    }
    else alert('not ok')
  }

  nodes.saveNext.onclick = () => {
    if(!words[num+1]) return
    if(!word.data) word.data = {memorizeLevel: 0}
    
    word.data.memorizeQuality = +nodes.memorizeQuality.value
    word.data.invokeDate = new Date()

    if(word.data.memorizeQuality === 1 && word.data.memorizeLevel > 0) word.data.memorizeLevel--
    if(word.data.memorizeQuality === 3 && word.data.memorizeLevel < 9) word.data.memorizeLevel++

    word.nextInvokeDate = new Date(+word.data.invokeDate + ls_reminder_time[word.data.memorizeLevel] * 24 * 3600 * 1000)

    asyncQueue.addItem(FM_makeFetch, [
        'https://api.notion.com/v1/pages/' + word.id,
        {
          method: 'PATCH',
          headers: NF_headers,
          body: JSON.stringify({
            properties: {
              [ls_props.data]: {
                rich_text: [{
                  type: 'text',
                  text: {content: JSON.stringify(word.data)}
                }]
              },
              [ls_props.nextInvokeDate]: {
                date: {
                  start: new Date(+word.nextInvokeDate + 2 * 3600 * 1000),
                  time_zone: 'Europe/Stockholm'
                }
              }
            }
          })
        }
      ]
    )
    
    console.log('Word pref saved')

    nodes.mainBlock.classList.add('opacity0')
    nodes.mainBlock.ontransitionend = () => {  
      setWord(words, num+1)
      nodes.mainBlock.classList.remove('opacity0')
    }
  }
}


wordsPromise.then(r => {
  setWord(words, 0)
})