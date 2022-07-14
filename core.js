function getNode(selector) {
  return document.querySelector(selector)
}

const [ls_access_data, ls_props] = ['access-data', 'props'].map(itm => JSON.parse(localStorage.getItem(itm) || '{}')),
      reminder_def_levels = [1, 3, 6, 12, 24, 48, 96, 192, 384, 768],
      ls_reminder_time = JSON.parse(localStorage.getItem('reminder-time') || JSON.stringify(reminder_def_levels))

if(!ls_access_data.integrationToken) ls_access_data.integrationToken = prompt('Integration token not found, write new token here')
if(!ls_access_data.databaseId) ls_access_data.databaseId = prompt('Database id not found, write new id here')

localStorage.setItem('access-data', JSON.stringify(ls_access_data))