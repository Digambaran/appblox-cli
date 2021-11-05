#!/usr/bin/env node
const clientID = 'b68059492d3bcd0535eb'
const url = 'https://github.com/login/device'
const getTokenURL = 'https://github.com/login/oauth/access_token'
const { exec, execSync } = require('child_process')
const { fork } = require('child_process')
const chalk = require('chalk')
const path = require('path')
const axios = require('axios')
const inquirer = require('inquirer')
const fs = require('fs')
const { Command } = require('commander')
// eslint-disable-next-line no-unused-vars
const { Observable, Subscriber, noop } = require('rxjs')
// UTILS
const Art = require('../utils/art.js')
const pbcopy = require('../utils/clipcopy.js')
const getSignedInUser = require('../utils/getSignedInUser')
const OTPConfirmation = require('../utils/OTPConfirmation')
const { newls } = require('../utils/listandselectrepos')
const { userRepos, userOrgs, orgTeams } = require('../utils/Queries')
const parseResponse = require('../utils/parseResponse')

const packageJson = require('../package.json')
const {
  cloneTemplateRepository,
  createRepository,
} = require('../utils/Mutations.js')

let pathToENV = path.resolve('./.env')

const handleAuth = async (data) => {
  const OTPresponse = parseResponse(data)
  const userCode = OTPresponse.user_code
  const expiresIn = OTPresponse.expires_in
  console.log('\n')
  console.log(
    'Please go to https://github.com/login/device, and paste the below code.'
  )
  Art(userCode)
  console.log('\n\n\n')
  pbcopy(userCode)
  const timerThread = TimerThread(expiresIn)
  // const timerThread={killed:true} -- for token expired testing.
  console.log(`Code expires in ${chalk.bold(expiresIn)} seconds `)
  await openBrowser()
  const Cdata = {
    client_id: clientID,
    device_code: OTPresponse.device_code,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  }
  const done = await OTPConfirmation(Cdata, getTokenURL, timerThread, pathToENV)
  if (done) return
  
    console.log('something went wrong')
    process.exit(0)
  
}

function openBrowser() {
  return new Promise((res, rej) =>
    exec(`start ${  url}`, (error, stdout, stderr) => {
      if (error) {
        // console.log(`error: ${error.message}`);
        rej(error)
      }
      if (stderr) {
        // console.log(`stderr: ${stderr}`);
        rej(stderr)
      }
      // console.log(`stdout: ${stdout}`);
      res('good')
    })
  )
}

async function checkAndSetAuth() {
  const r = require('dotenv').config({ path: pathToENV })
  // console.log(process.env.TOKEN);
  if (r.error) {
    // console.log('error reading env file', r.error);
    // If in error because of any other reason,
    // remove file and do new auth.
    r.error.code !== 'ENOENT' && fs.unlinkSync(pathToENV)
    console.log(chalk.red('Not signed in!'))
    return { redoAuth: true }
  } 
    // make call to check if the user has revoked access,
    // if not log the signed in name.
    // else redo auth
    const { user } = await getSignedInUser(process.env.TOKEN)
    if (user && correctCredsInEnv(user.userName, user.userId)) {
      console.log(`Signed in as ${chalk.whiteBright(user.userName)}`)
      return { redoAuth: false }
    } 
      // console.log(error);
      console.log('Not signed in, redirecting to signin!')
      return { redoAuth: true }
      // process.exit(0)
    
  
}
/**
 * Checks if Name and Id returned for given token is same as present in env
 * @param {string} name Login name returned from github for present token
 * @param {string} id Id for the token present in env
 * @returns {Boolean}
 */
function correctCredsInEnv(name, id) {
  return process.env.USER === name && process.env.USERID === id
}

/**
 * Creates dir if not present
 * @param {String} dir Path of directory
 * @returns
 */
function ensureDirSync(dir) {
  let stats
  try {
    stats = fs.statSync(dir)
  } catch {
    noop()
  }
  if (stats && stats.isDirectory()) return
  
    fs.mkdirSync(dir)
    
  
}

function createFileSync(file) {
  let stats
  try {
    stats = fs.statSync(file)
  } catch {
    noop()
  }
  if (stats && stats.isFile()) return

  const dir = path.dirname(file)
  try {
    if (!fs.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs.readdirSync(dir)
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') fs.mkdirSync(dir)
    else throw err
  }

  fs.writeFileSync(file, '')
}

function createprojectstructure(name) {
  const root = path.resolve(name)
  // const appName = path.basename(root)
  // TODO--Check if parent name is okay here
  ensureDirSync(root)
  process.chdir(root)
  fs.mkdirSync(path.resolve('HouseClient'))
  fs.appendFileSync(pathToENV, `\nCLIENTHOUSE=${  path.resolve('HouseClient')}`)
  // TODO--
  // create house client and container here, prompt for creating from template
  // map to env
}

const start = async (key, dir) => {
  try {
    // setting env path for before checkAndSetAuth and handleAuth
    pathToENV = path.resolve(dir, '.env')
    // if a new project then env parent directory might be missing, to avoid error in OTPConfirmation
    key === 'newproject' && createFileSync(pathToENV)

    const { redoAuth } = await checkAndSetAuth()
    if (redoAuth) {
      const response = await axios.post(
        'https://github.com/login/device/code',
        { client_id: clientID, scope: 'repo,read:org' }
      )
      await handleAuth(decodeURIComponent(response.data))
    }
    switch (key) {
      case 'newproject':
        console.log(dir)
        // since env is created by OTPConfirmation in process.cwd(),
        // pathToENV = path.resolve(dir, ".env")
        // createFileSync(pathToENV)
        createprojectstructure(dir)
        break
      case 'updateproject':
        console.log(dir)
        createprojectstructure(dir)
        // updateProjectDetails()
        break
      case 'newcomponent':
        console.log('creaete new repo')
        console.log('move to -', process.env.HF)
        console.log('init as submodules')
        console.log('done')
        createRepo()
        break
      default:
        break
    }
  } catch (e) {
    console.log('Something went wrong', e)
    process.exit(0)
  }

  // cpf.on('exit',(c)=>console.log('exited,c',c))
}

// start();

function TimerThread(seconds) {
  const cpf = fork(path.join(__dirname, 'timer.js'), [seconds])
  // console.log('pid-',cpf.pid);
  // console.log('Thread started for ', seconds);
  cpf.on('message', (m) => {
    // console.log(m);
    if (m === 'STOP') {
      process.exit(0)
    }
  })
  // cpf.on('close',(c)=>console.log('timer stopped',c))
  // cpf.on('exit',(c)=>console.log('timer stopped',c))
  return cpf
}

function init() {
  const program = new Command()
  const addC = program.command('add')
  // TODO -- get version properly
  program.version(packageJson.version)

  program
    .command('init')
    .arguments('<project-directory>')
    .description('start everything')
    .action(async (name) => {
      console.log('init called with', name)
      const createnewproject = await fieldTest(name)
      if (createnewproject) {
        // If current dir is clean or has only folders and new project is in new folder, ie not "init ."
        start('newproject', name)
      } else {
        // cant run update existing project details logic here,
        // because false might also mean, there are just a lot of files and dirs..
      }
    })

  addC
    .command('component')
    .description('to add')
    .action((values) => {
      console.log(values)
      start('newcomponent')
    })
  program.parse(process.argv)
}

init()

/**
 *
 * @returns {String|Number} Path string if env is found, else object with number of directories and files
 */
function isDirClean() {
  const dir = process.cwd()
  try {
    const files = fs.readdirSync(dir)
    if (files.includes('.env')) {
      return dir
    } 
      return files.reduce(
        (acc, file) => {
          if (fs.statSync(path.resolve(file)).isDirectory())
            return { ...acc, dirs: acc.dirs + 1 }
          return { ...acc, files: acc.files + 1 }
        },
        { dirs: 0, files: 0 }
      )
    
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
  // console.log(dir);
  // console.log(process.cwd());
  // if(dir===path.parse(process.cwd()).root) return
  // if(dir===path.parse(process.cwd()).root) return
  // try {
  //   const arrayOfFiles = fs.readdirSync(dir)
  //   console.log(arrayOfFiles)
  //   isDirClean(path.join(dir,"../"))
  // } catch(e) {
  //   console.log(e)
  // }
}

function WipeAllConfirmation() {
  return inquirer.prompt({
    type: 'confirm',
    message: 'There are files,Do you want to wipe all',
    name: 'wipeAll',
  })
}

function wipeAllFilesIn(dir) {
  console.log('wiping in ', dir)
  const files = fs.readdirSync(dir)
  try {
    for (let i = 0; i < files.length; i++) {
      console.log('Removing ', path.join(dir, files[i]))
      fs.rmSync(path.join(dir, files[i]), { recursive: true, force: true })
    }
  } catch (e) {
    console.log('error deleting files')
  }
}
async function fieldTest(dirName) {
  /**
   * @typedef DirData
   * @type {Object}
   * @property {Number} dirs
   * @property {Number} files
   */
  /**
   * @type {String|DirData}
   */
  const penv = isDirClean()
  /**
   * If an env file is found and has "appblox specific key" set
   * (Which is a TODO)
   * Then, ask whether to delete all files and create new project,
   * or continue
   */
  if (typeof penv === 'string') {
    // TODO -- find and set pathToENV here
    const trr = require('dotenv').config({ path: path.join(penv, '.env') })
    if (!trr.error) {
      const prname = process.env.PROJECT
      console.log(`Found project ${chalk.gray(prname)}`)
    }
  } else {
    // if the dir only contains directories and no files,
    // and user is trying to create project not in current dir then createnewproject.
    if (penv.files === 0 && penv.dirs) {
      if (dirName !== '.') return true
    }
    if (!penv.files && !penv.dirs) {
      console.log('target is clean,creating project..')
      return true
    }
  }
  /**
   * If not string, then must be a truthy value, so not 0
   */
  // if there are no files in the directory and a new directory is going to be created,
  // then no need to wipe.
  const { wipeAll } = await WipeAllConfirmation()
  if (wipeAll) {
    wipeAllFilesIn(process.cwd())
    return true
  } 
    // TODO-- Display current project details here if existing project is found
    // Might not always contain projects, so handle the Update project logic here itself.
    // console.log("Current project details-")
    // console.log("User - ", process.env.USER)
    // console.log("Project - ", process.env.PROJECT)
    // console.log("Paths and such here")
    return false
  
}

function getTemplateV2() {
  const questions = [
    {
      type: 'confirm',
      name: 'createFromTemplate',
      message: 'Create repo from a template',
    },
    {
      type: 'customList',
      name: 'selectTemplate',
      message: 'select a template repo',
      choices: [], // give empty list, custom list loads from api
      source: new newls(userRepos.Q, userRepos.Tr_t).sourceAll,
      pageSize: 22,
      loop: false,
      when: (ans) => ans.createFromTemplate,
    },
  ]
  return inquirer
    .prompt(questions)
    .then((ans) => ans.selectTemplate || null)
    .catch((err) => console.log(err, 'lll'))
}
/**
 * Prompts user for template repo selection
 * @returns {String|Null}
 */
// eslint-disable-next-line no-unused-vars
function getOrgId() {
  const question = [
    {
      type: 'customList',
      name: 'selectOrg',
      message: 'select a organization',
      choices: [], // give empty list, loads initial set
      source: new newls(userOrgs.Q, userOrgs.Tr).sourceB,
      pageSize: 22,
    },
  ]
  return inquirer.prompt(question).then((ans) => {
    console.log(ans)
    // TODO -- if there are no organization returned from call,
    // nothing will be listed, and user entering return in that case
    // might cause inquirer to run into error, which is not handled
    // and if there are no organizations, ask user whether to create in
    // user git itself.

    // ans will have display name followed by Id seperated by "/"
    return ans.selectOrg.split('/')
  })
}

/**
 *
 * @param {String} ownerId OrgId or UserId,
 * @param {("org" | "user")} ownerType Type of owner
 * @param {String|null} [orgName] Name of organization
 */
async function createRepo(ownerId, ownerType, orgName) {
  /**
   * @type { Null|String} The user selected template repo
   */
  const template = await getTemplateV2()
  const questions = [
    {
      type: 'input',
      name: 'reponame',
      message: 'Name for repo',
    },
    {
      // TODO - should give option to skip
      type: 'input',
      name: 'description',
      message: 'Description of repo',
    },
    {
      type: 'list',
      name: 'visibility',
      message: 'visibility of repo',
      choices: ['PRIVATE', 'PUBLIC', 'INTERNAL'],
    },
  ]
  if (!template) {
    questions.push({
      type: 'confirm',
      message: 'Mark as a template repo',
      name: 'markAsTemplate',
    })
  }
  // if creating in organization and not from a template,
  // then need to send team id that should be given access,
  // might need to change to multiple select if can pass multiple team ids
  if (ownerType === 'org' && !template) {
    questions.push({
      type: 'list',
      message: 'select team to give access',
      name: 'selectTeam',
      choices: () => new newls(orgTeams.Q, orgTeams.Tr).sourceAll(orgName),
    })
  }
  const ans = await inquirer.prompt(questions)

  console.log(ans)
  // process.exit(0)

  const apiGraph = ' https://api.github.com/graphql'
  const headersV4 = {
    'Content-Type': 'application/json',
    // 'Authorization': 'bearer ' + obj['access_token'],
    Authorization: `bearer ${  process.env.TOKEN}`,
    Accept: 'application/vnd.github.v4+json',
  }
  try {
    const { data } = await axios.post(
      apiGraph,
      {
        query: template ? cloneTemplateRepository.Q : createRepository.Q,
        variables: {
          name: ans.reponame,
          owner: ownerId,
          templateRepo: template,
          template: ans.markAsTemplate || null,
          description: ans.description,
          visibility: ans.visibility,
          team: ans.selectTeam || null,
        },
      },
      { headers: headersV4 }
    )
    if (data.errors) {
      // TODO -- write data.errors.message to combined log here
      console.log(data.errors)
      throw new Error(
        `Something went wrong with query,\n${  data.errors.message}`
      )
    }
    const repoUrl = template
      ? cloneTemplateRepository.Tr(data)
      : createRepository.Tr(data)
    execSync(`git clone ${  repoUrl}`, { stdio: 'inherit' })
    console.log(chalk.green('Successfully Cloned!'))
  } catch (err) {
    console.log(chalk.red(`<<${  err.message  }>>`))
  }
}
