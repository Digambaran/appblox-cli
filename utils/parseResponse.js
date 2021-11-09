/**
 * Takes string and returns object
 * @param {String} data Data response from github
 * @returns An object
 */
function parseGitResponse(data) {
  return data.split('&').reduce((acc, v) => {
    const [k, val] = v.split('=')
    acc[k] = val
    return acc
  }, {})
}

module.exports = parseGitResponse
