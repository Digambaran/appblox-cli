/**
 * To get confirmation from user once the provided 6 digit
 * code is entered into  https://github.com/login/device,
 *
 * if user confirms, check if access is granted
 * if not, rerequest user for confirmation,
 * if no access after second confirmation inform and ABORT.
 *
 * if user gives NO, reconfirm and inform and ABORT
 */

// eslint-disable-next-line no-unused-vars
const { ChildProcess } = require('child_process')
const inquirer = require('inquirer')
// eslint-disable-next-line no-unused-vars
const { Observable, Subscriber } = require('rxjs')
const axios = require('axios')
const fs = require('fs')
const getSignedInUser = require('./getSignedInUser')
// const path = require("path")
// const pathToENV = path.resolve("./.env")
const parseResponse = require('./parseResponse')
/**
 * @type {Subscriber}
 */
let Emitter

/**
 * Shows message and exits.
 * @param {string} msg Message to show.
 */
function Abort(msg) {
  // eslint-disable-next-line no-console
  console.log(`Aborting ${msg}`)
  process.exit(0)
}

// TODO -- killing thread, is it a good choice? could use .kill ??

const stream = new Observable((obs) => {
  Emitter = obs
  obs.next({
    type: 'confirm',
    name: 'authConfirm',
    message: 'Access granted?',
  })
})

/**
 * @typedef {("slow_down" | "unsupported_grant_type" | "incorrect_device_code" | "incorrect_client_credentials" |
 * "access_denied" | "authorization_pending" | "expired_token")} errorCodes
 */
/**
 * @typedef TokenDataError
 * @type {object}
 * @property {errorCodes} error Error code
 * @property {string} error_description Description of error
 * @property {string} error_uri URL to documentation
 */
/**
 * @typedef TokenDataSuccess
 * @type {object}
 * @property {string} access_token The auth token
 * @property {string} token_type Type of token (bearer)
 * @property {string} scope The scope of auth - refer "https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps"
 */
/**
 * Handles token error
 * @param {errorCodes} msg Error message
 * @param {ChildProcess} thread
 * @param {number} count
 */
function handleTokenError(msg, thread, count) {
  // console.log('count', count);
  switch (msg) {
    case 'access_denied':
      // complete stream, exit and restart process
      thread.send('KILLTIMER') // just to be safe since detached is not given it should get killed with parent..
      Abort('Such a wicked game..Access denied!!')
      break
    case 'authorization_pending':
      // Ask user to give access, maybe show the code again or copy it
      // to clipboard, give hints
      if (count === 1 || count === 2)
        console.log(
          "Seems like authorization is still pending..\nPlease go to https://github.com/login/device, and paste the above code.'"
        )

      if (count === 3) console.log('Nope! still not authorized')
      if (count === 4) console.log('Last chance!! You can do it..')
      if (count === 5) {
        console.log('Whew..whatever.')
        thread.send('KILLTIMER') // just to be safe
        Abort('Not authorized.')
      }
      // goto authConfirm step
      Emitter.next({
        type: 'confirm',
        message: 'Acces granted?',
        name: 'authConfirm',
        askAnswered: true,
      })
      break
    case 'expired_token':
      // Most probably wont happen, as timer would have killed the process already
      // if happens, abort and restart process
      if (!thread.killed) thread.send('KILLTIMER') // just to be safe
      Abort('Token expired')
      break
    default:
      console.log('Something went terribly wrong..I am Aborting!!')
      thread.send('KILLTIMER') // just to be safe
      process.exit(1)
  }
}

/**
 *
 * @param {object} data
 * @param {string} url
 * @param {ChildProcess} thread
 */
async function OTPVerify(data, url, thread, pathToENV) {
  /**
   * To store retry number, if user confirms authenticating but flow fails
   * @type {number}
   */
  let authYesRetryCount = 0
  /**
   * To store retries where user aborts and doesnt confirm that, aborts again..
   * @type {number}
   */
  let abortYesNoCount = 0
  /**
   * @type {TokenDataError|TokenDataSuccess}
   */
  // let TokenData;
  return new Promise((res) =>
    inquirer.prompt(stream).ui.process.subscribe({
      next: async (ans) => {
        const { name, answer } = ans
        // console.log(ans);
        switch (name) {
          case 'authConfirm':
            authYesRetryCount += 1
            if (answer) {
              // TODO - give a loading screen
              try {
                const getTokenResponse = await axios.post(url, data)
                // console.log('gettokenresponse', getTokenResponse);
                const TokenData = parseResponse(
                  decodeURIComponent(getTokenResponse.data)
                )
                // console.log('TokenData', TokenData);
                // if there is a network call error, it will directly
                // go to catch.. if any other error, status is 200 but response
                // with have TokenDataError type, if so throw and catch.
                // if success response will have TokenDataSuccess type, continue..
                if (TokenData.error) {
                  // if user has not authorized yet - authorization_pending
                  // if pressed cancel on auth screen - access_denied
                  // if device code has expired - expired_token
                  throw new Error(TokenData.error)
                }
                const { user } = await getSignedInUser(TokenData.access_token)
                if (user) {
                  // Remove the loading screen
                  process.env.TOKEN = TokenData.access_token
                  process.env.USER = user.userName
                  process.env.USERID = user.userId
                  Emitter.next({
                    type: 'confirm',
                    name: 'confirmUser',
                    message: `Continue as ${user.userName}?`,
                  })
                } else {
                  // TODO
                  // error here or redo call for token and try with that
                  // console.log(error);
                  // Remove the loading screen
                  Abort('No user found')
                }
              } catch (e) {
                // Since getSignedInUser catches error internally,
                // this should be from token call, either because
                // user has not authorized yet or network error.
                // TODO - if network error, retry 3 times.
                // console.log('error getting token ', e, e.message);
                handleTokenError(e.message, thread, authYesRetryCount)
              }
            } else {
              // Remove the loading screen
              Emitter.next({
                type: 'confirm',
                name: 'abortConfirmation',
                message: 'Are you sure you want to abort?',
                askAnswered: true,
              })
            }
            break
          case 'abortConfirmation':
            abortYesNoCount += 1
            if (answer) {
              if (!thread.killed) thread.send('KILLTIMER')
              Emitter.complete()
              Abort('User aborted!')
            } else {
              // display code again, copy to clipboard and ask to confirm again
              if (abortYesNoCount === 5) {
                console.log('I have better things to do with my life!!')
                console.log('Aborting')
                if (!thread.killed) thread.send('KILLTIMER')
                Abort('Make up your mind!!')
              }
              // TODO -- add more comments
              Emitter.next({
                type: 'confirm',
                message: 'Acces granted?',
                name: 'authConfirm',
                askAnswered: true,
              })
            }
            break
          case 'confirmUser':
            if (answer) {
              thread.send('KILLTIMER')
              // TODO--causes error- not access to TokenData
              fs.writeFileSync(
                pathToENV,
                `TOKEN=${process.env.TOKEN}\nREFRESH=0\nUSER=${process.env.USER}\nUSERID=${process.env.USERID}`
              )
              Emitter.complete()
            } else {
              Abort('Diff user')
            }
            break
          case 'authPending':
            break
          default:
            break
        }
      },
      error: (err) => {
        console.log('Error: ', err)
        res(false)
      },
      complete: () => {
        console.log('Auth Completed')
        res(true)
      },
    })
  )
}

module.exports = OTPVerify
