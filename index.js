if(ls_app_settings.showCheckButtons) document.body.classList.add('shown-checks')

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
    body: JSON.stringify({
      start_cursor: cursor,
      page_size: amount,
      filter: {
        property: ls_props.nextInvokeDate,
        date: {
          on_or_before: new Date(+new Date() + 31 * 24 * 3600 * 1000).toISOString()
        }
      },
      sorts: [
        {
          property: ls_props.nextInvokeDate,
          direction: 'ascending'
        },
        {
          property: 'Created time',
          direction: 'ascending'
        }
      ]
    })
  })
  .then(r => r.text())
  .then(JSON.parse)

  if(r.next_cursor && !amount) return r.results.concat(await getItems(undefined, r.next_cursor))
  return r.next_cursor && amount > 100 ? r.results.concat(await getItems(amount - 100, r.next_cursor)) : r.results
}

let curWord = null,
    curWordNum = 0,
    engToSw = 0

const words = [],
      wordsPromise = getItems(+ls_app_settings.wordsPerDay).then(async arr => {

  for(let i = 0; i < arr.length; i++) {
    // words[words.length] = {}

    const itm = arr[i],
          // propsData = words[words.length - 1],
          propsData = {}

    for(const key in ls_props) {
      propsData[key] = await FM_makeFetch('https://api.notion.com/v1/pages/' + itm.id + '/properties/' + ls_props[key], {headers: NF_headers})
      .then(r => r.text())
      .then(r => {
        r = JSON.parse(r)
        if(r.type !== 'date') {
          return r.results.reduce((str, itm) => str += itm[itm.type].text.content, '')
        }
        return r.date
      })
    }
    if(propsData.data) {
      propsData.data = JSON.parse(propsData.data)
      propsData.data.invokeDate = new Date(propsData.data.invokeDate)
    }
    propsData.id = itm.id
    words.push(propsData)

    if(getNode('.loaded-words-num')) getNode('.loaded-words-num').innerText = words.length

    if(i === +ls_app_settings.startCachedWords) {
      initWords()
      setWord(words, 0)
    }
  }

  return words
})
.then(r => {
  // console.log('Receive data finished:', r)
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
  mainBlock: getNode('fieldset.word-content.word-card'),
  word: getNode('h3.word-title'),
  checkSpelling: {
    form: getNode('form.word-item.check-spelling'),
    input: getNode('input#check_spelling')
  },
  wordVariants: {
    form: getNode('form.word-variants-content'),
    fields: [1, 2, 3, 4].map(itm => {
      return {
        checkbox: getNode('input#word_radio_' + itm),
        label: getNode('label[for="word_radio_' + itm + '"]')
      }
    })
  },
  memorizeQuality: getNode('input#memorize_quality'),
  saveNext: getNode('.save-next'),
  finishBlock: getNode('fieldset.finish-content')
}

nodes.checkSpelling.form.onsubmit = e => {
  e.preventDefault()
  const inWord = nodes.checkSpelling.input.value.toLowerCase(),
        controlWord = curWord[engToSw ? 'title' : 'eng'].toLowerCase()

  nodes.checkSpelling.form.querySelector('.check-indicator > span:first-child').style.display = ''
  nodes.checkSpelling.form.querySelector('.check-indicator > span:last-child').style.display = ''

  // NEED MAKE NORMAL FUNCTION OF EQUALATION WORDS
  if(controlWord.replace('en ', '').replace('ett ', '') === inWord) {
    nodes.checkSpelling.form.querySelector('.check-indicator > span:first-child').style.display = 'inline'
    nodes.memorizeQuality.value = 3
  }
  else {
    nodes.checkSpelling.form.querySelector('.check-indicator > span:last-child').style.display = 'inline'
    nodes.memorizeQuality.value = 2
  }
}

nodes.wordVariants.form.onsubmit = e => {
  e.preventDefault()
  
  getNode('.word-item.word-variants .check-indicator span:first-child').style.display = ''
  getNode('.word-item.word-variants .check-indicator span:last-child').style.display = ''

  if(JSON.parse(nodes.wordVariants.fields.find(itm => itm.checkbox.checked)?.checkbox.value || 'false')) {
    getNode('.word-item.word-variants .check-indicator span:first-child').style.display = 'inline'
    nodes.memorizeQuality.value = 2
  }
  else {
    getNode('.word-item.word-variants .check-indicator span:last-child').style.display = 'inline'
    nodes.memorizeQuality.value = 1
  }
}

nodes.saveNext.onclick = () => {
  if(!curWord.data) curWord.data = {memorizeLevel: 0}
  
  curWord.data.memorizeQuality = +nodes.memorizeQuality.value
  curWord.data.invokeDate = new Date()

  if(curWord.data.memorizeQuality === 1 && curWord.data.memorizeLevel > 0) curWord.data.memorizeLevel--
  if(curWord.data.memorizeQuality === 3 && curWord.data.memorizeLevel < 9) curWord.data.memorizeLevel++

  curWord.nextInvokeDate = new Date(+curWord.data.invokeDate + ls_reminder_time[curWord.data.memorizeLevel] * 24 * 3600 * 1000)

  asyncQueue.addItem(FM_makeFetch, [
      'https://api.notion.com/v1/pages/' + curWord.id,
      {
        method: 'PATCH',
        headers: NF_headers,
        body: JSON.stringify({
          properties: {
            [ls_props.data]: {
              rich_text: [{
                type: 'text',
                text: {content: JSON.stringify(curWord.data)}
              }]
            },
            [ls_props.nextInvokeDate]: {
              date: {
                start: new Date(+curWord.nextInvokeDate + 2 * 3600 * 1000),
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
  nodes.mainBlock.style.pointerEvents = 'none';
  nodes.mainBlock.ontransitionend = () => {  

    if(nodes.mainBlock.classList.contains('opacity0')) {
      if(curWordNum + 1 >= words.length) {
        nodes.mainBlock.style.display = 'none'
        nodes.finishBlock.style.display = ''
        setTimeout(() => nodes.finishBlock.classList.remove('opacity0'), 1)
      }
      else {
        setWord(words, curWordNum + 1)
        nodes.mainBlock.classList.remove('opacity0')
        nodes.mainBlock.style.pointerEvents = '';
      }
    }
  }
}

function initWords() {
  loadingBar.remove()
  nodes.mainBlock.style.display = ''
  setTimeout(() => nodes.mainBlock.classList.remove('opacity0'), 1)
}

function setWord(wordsArr, num) {
  if(!wordsArr[num]) {
    console.log('Item not exist!')
    return
  }

  nodes.mainBlock.querySelector('legend').innerHTML = 'Word - ' + (num+1) + '/' + ls_app_settings.wordsPerDay

  getNode('.word-variants-content').classList.remove('shown')

  nodes.checkSpelling.form.querySelector('.check-indicator > span:first-child').style.display = ''
  nodes.checkSpelling.form.querySelector('.check-indicator > span:last-child').style.display = ''
  nodes.checkSpelling.input.value = ''
  getNode('.word-item.word-variants .check-indicator span:first-child').style.display = ''
  getNode('.word-item.word-variants .check-indicator span:last-child').style.display = ''
  document.querySelectorAll('input[name="word_radio"]').forEach(itm => itm.checked = 0)
  
  curWord = wordsArr[num],
  curWordNum = num
  engToSw = Math.round(Math.random() * 2)

  nodes.word.innerText = curWord[engToSw ? 'eng' : 'title']
  
  rndNumsArr = []

  for(let i = 0; i < 4; i++) {
    let rnd = Math.floor(Math.random() * wordsArr.length)
    while(rndNumsArr.includes(rnd) && wordsArr.length > 3) {
      rnd = Math.floor(Math.random() * wordsArr.length)
    }
    rndNumsArr.push(rnd)
  }

  if(!rndNumsArr.includes(curWordNum)) rndNumsArr[Math.floor(Math.random() * 4)] = curWordNum

  nodes.wordVariants.fields.forEach(({checkbox, label}, i) => {
    checkbox.value = rndNumsArr[i] === curWordNum
    label.innerText = wordsArr[rndNumsArr[i]][engToSw ? 'title' : 'eng']
  })
}


// wordsPromise.then(({results: r, next_cursor}) => {
//   setWord(words, 0)
// })