const nodes = {
  access: {
    integrationToken: getNode('input#integrationToken'),
    databaseId: getNode('input#databaseId'),
  },
  props: {
    title: getNode('input#prop_title'),
    eng: getNode('input#prop_eng'),
    data: getNode('input#prop_data'),
    nextInvokeDate: getNode('input#prop_nextInvokeDate')
  },
  reminder_time: {
    levels: ls_reminder_time.map((itm, i) => getNode('input#rtl' + i)),
    reset_button: getNode('.reminder-time button.default-button.reset')
  },
  app_settings: {
    wordsPerDay: getNode('input#wordsPerDay'),
    startCachedWords: getNode('input#startCachedWords'),
    showCheckButtons: getNode('input#showCheckButtons'),
    randomizeWordSequence: getNode('input#randomizeWordSequence')
  },
  save_button: getNode('button.default-button.save')
}

function init() {
  ['integrationToken', 'databaseId'].forEach(itm => nodes.access[itm].value = ls_access_data[itm])
  for(const key in ls_props) nodes.props[key].value = ls_props[key]
  ls_reminder_time.forEach((itm, i, arr) => nodes.reminder_time.levels[i].value = itm)
  for(const key in ls_app_settings) {
    const inpt = nodes.app_settings[key]
    if(inpt.type === 'checkbox') inpt.checked = ls_app_settings[key]
    else inpt.value = ls_app_settings[key]
  }
}
init()

function saveData() {
  ['integrationToken', 'databaseId'].forEach(itm => ls_access_data[itm] = nodes.access[itm].value)
  for(const key in nodes.props) ls_props[key] = nodes.props[key].value
  ls_reminder_time.forEach((itm, i, arr) => arr[i] = nodes.reminder_time.levels[i].value)
  for(const key in ls_app_settings) {
    const inpt = nodes.app_settings[key]
    if(inpt.type === 'checkbox') ls_app_settings[key] = inpt.checked
    else ls_app_settings[key] = inpt.value
  }

  localStorage.setItem('access-data', JSON.stringify(ls_access_data))
  localStorage.setItem('props', JSON.stringify(ls_props))
  localStorage.setItem('reminder-time', JSON.stringify(ls_reminder_time))
  localStorage.setItem('app-settings', JSON.stringify(ls_app_settings))
}

function resetReminderLevels() {
  reminder_def_levels.forEach((itm, i, arr) => nodes.reminder_time.levels[i].value = itm)
}

nodes.save_button.addEventListener('click', saveData)
nodes.reminder_time.reset_button.addEventListener('click', resetReminderLevels)