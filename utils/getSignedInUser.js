//TODO -- could retry 3 times.
const axios = require("axios")

module.exports = getSignedInUser
/**
 * @typedef userObject
 * @type {object}
 * @property {(String|Null)} userName
 * @property {(String|Null)} userId
 */

/**
 * @typedef ReturnType
 * @type {object}
 * @property {userObject} user The name and id of user if call is success, both null otherwise
 * @property {(string|null)} error A human readable error message
 */

/**
 * Make call with the given token and retrieve the name of user
 * @param {string} TOKEN Token from env
 * @returns {ReturnType}
 */
async function getSignedInUser(TOKEN) {
  const query = `query { 
        viewer { 
          login
          id
        }
      }`
  const url = "https://api.github.com/graphql"
  const headers = {
    "Content-Type": "application/json",
    Authorization: "bearer " + TOKEN,
    Accept: "application/vnd.github.v4+json",
  }
  try {
    // Check if TOKEN still working
    const response = await axios.post(
      url,
      { query: query },
      { headers: headers }
    )
    return {
      user: {
        userId: response.data.data.viewer.id,
        userName: response.data.data.viewer.login,
      },
      error: null,
    }
  } catch (e) {
    // If not properly working, redo auth again.
    console.log(e.response.status, e.response.statusText, e.response.data)
    // if status is 401 return with message {user,error}
    // else retry with 1sec delay
    if (e.response.status == 401) {
      return { user: null, error: e.response.statusText }
    } else {
      //retry here
      //TODO
      process.exit(0)
    }
  }
}
