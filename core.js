function getNode(selector) {
  return document.querySelector(selector)
}

const [ls_access_data, ls_props] = ['access-data', 'props'].map(itm => JSON.parse(localStorage.getItem(itm) || '{}')),
      reminder_def_levels = [1/24, .125, .25, .5, 1, 3, 6, 12, 24, 48, 96, 192, 384, 768],
      ls_reminder_time = JSON.parse(localStorage.getItem('reminder-time') || JSON.stringify(reminder_def_levels)),
      ls_app_settings = JSON.parse(localStorage.getItem('app-settings') || '{}')

if(!ls_access_data.integrationToken) ls_access_data.integrationToken = prompt('Integration token not found, write new token here')
if(!ls_access_data.databaseId) ls_access_data.databaseId = prompt('Database id not found, write new id here')

if(!ls_app_settings.wordsPerDay) ls_app_settings.wordsPerDay = 30
if(!ls_app_settings.startCachedWords) ls_app_settings.startCachedWords = 5

localStorage.setItem('access-data', JSON.stringify(ls_access_data))
localStorage.setItem('reminder-time', JSON.stringify(ls_reminder_time))
localStorage.setItem('app-settings', JSON.stringify(ls_app_settings))