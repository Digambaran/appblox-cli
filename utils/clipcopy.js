/* eslint-disable no-console */
const { exec } = require('child_process')

module.exports = function pbcopy(data) {
  // TODO--make it work for all terminals
  exec(`echo | set /p=${data}| clip`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    console.log('Code copied to Clipboard!!')
  })
}
