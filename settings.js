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
    levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(itm => getNode('input#rtl' + itm)),
    reset_button: getNode('.reminder-time button.default-button.reset')
  },
  save_button: getNode('button.default-button.save')
}

function init() {
  ['integrationToken', 'databaseId'].forEach(itm => nodes.access[itm].value = ls_access_data[itm])
  for(const key in ls_props) nodes.props[key].value = ls_props[key]
  ls_reminder_time.forEach((itm, i, arr) => nodes.reminder_time.levels[i].value = itm)
}
init()

function saveData() {
  ['integrationToken', 'databaseId'].forEach(itm => ls_access_data[itm] = nodes.access[itm].value)
  for(const key in nodes.props) ls_props[key] = nodes.props[key].value
  ls_reminder_time.forEach((itm, i, arr) => arr[i] = nodes.reminder_time.levels[i].value)

  localStorage.setItem('access-data', JSON.stringify(ls_access_data))
  localStorage.setItem('props', JSON.stringify(ls_props))
  localStorage.setItem('reminder-time', JSON.stringify(ls_reminder_time))
}

function resetReminderLevels() {
  reminder_def_levels.forEach((itm, i, arr) => nodes.reminder_time.levels[i].value = itm)
}

nodes.save_button.addEventListener('click', saveData)
nodes.reminder_time.reset_button.addEventListener('click', resetReminderLevels)