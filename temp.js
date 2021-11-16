/* eslint-disable */
const path = require('path')
const fs = require('fs')
const readline = require('readline')

!(function t() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('Where do you live ? ', (country) => {
    console.log(country)
    const root = path.resolve(country, 'se')
    const parent = path.dirname(root)
    const appName = path.basename(root)
    console.log('parent', parent, root)
    try {
      const files = fs.readdirSync(root)
      if (files.includes('.env')) {
        console.log('Found env')
      }
      const ans = files.reduce(
        (acc, file) => {
          const p = path.resolve(file)
          const stat = fs.statSync(p)

          console.log(
            `${p} is ${stat.isDirectory() ? 'a ' : 'not a'} directory`
          )
          if (stat.isDirectory()) return { ...acc, dirs: acc.dirs + 1 }
          return { ...acc, files: acc.files + 1 }
        },
        { dirs: 0, files: 0 }
      )
      console.log(files.length)
      console.log(ans)
    } catch (e) {
      console.log(e)
      process.exit(1)
    }
    try {
      const ssstat = fs.statSync(root)
      console.log(ssstat.isDirectory())
      console.log(ssstat)
      const dir = fs.readdirSync(root)
    } catch (e) {
      console.log('error1', e)
    }
    try {
      const dir = fs.opendirSync(root)
    } catch (e) {
      console.log('error2', e)
    }
    console.log(root, appName)
    rl.close(country)
  })

  rl.on('close', () => {
    console.log('\nBYE BYE !!!')
    process.exit(0)
  })
})()

function demo() {
  inquirer.registerPrompt(
    'file-tree-selection',
    require('inquirer-file-tree-selection-prompt')
  )
  inquirer.registerPrompt('customList', require('../utils/customList'))

  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'confirm',
      name: 'alreadyARepo',
      message: 'Already a repo',
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'alreadyARepo':
          if (answer) {
            //
            // User says already a housing repo
            // Check for specific files that can confirm the claim
            // TODO--check if really a housing repo
            //
            Emitter.next({
              type: 'file-tree-selection',
              name: 'housingFolder',
              message: 'Point me to house folder',
              onlyShowDir: true,
            })
          } else {
            // TODO -- initialize files to make a housing folder
          }
          break
        case 'housingFolder':
          // console.log('selected Dir', answer);
          // TODO--set in env
          // TODO--check if .gitmodules folder is present
          Emitter.next({
            type: 'list',
            message: 'where to create repo',
            name: 'where',
            choices: [
              { name: 'my git name', value: 'my git', short: 'sdfsdfsd' },
              'org git',
            ],
          })
          break
        case 'where':
          // show  templates after selecting template
          // TODO--list only orgs with write access, change query in QUERIES accordingly
          if (answer === 'my git') {
            // create a repo
            createRepo(process.env.USERID, 'user', null)
            // if (template) {
            //   //TODO -- make call to create a repo from a template
            // } else {
            //   //TODO--create a repo,
            //   //    --Ask user if readme liscence etc need be created
            // }
          } else {
            /**
             * @type {String}
             */
            const [orgName, orgId] = await getOrgId()
            createRepo(orgId, 'org', orgName)
            // list orgs
          }
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log(c)
    },
  })
}

function CreateNewProject() {
  console.log('Creating new project')
  inquirer.registerPrompt(
    'file-tree-selection',
    require('inquirer-file-tree-selection-prompt')
  )
  inquirer.registerPrompt('customList', require('../utils/customList'))

  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'list',
      message: 'where to create repo',
      name: 'where',
      choices: ['my git', 'org git'],
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'where':
          // TODO--list only orgs with write access, change query in QUERIES accordingly
          if (answer === 'my git') {
            // create a repo
            createRepo(process.env.USERID, 'user', null)
            //   //TODO--create a repo,
            //   //    --Ask user if readme liscence etc need be created
          } else {
            /**
             * @type {String}
             */
            const [orgName, orgId] = await getOrgId()
            createRepo(orgId, 'org', orgName)
          }
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log(c)
    },
  })
}

function updateProjectDetails() {
  inquirer.registerPrompt(
    'file-tree-selection',
    require('inquirer-file-tree-selection-prompt')
  )
  inquirer.registerPrompt('customList', require('../utils/customList'))

  /**
   * @type {Subscriber}
   */
  let Emitter
  const stream = new Observable((obs) => {
    Emitter = obs
    obs.next({
      type: 'confirm',
      name: 'changeUser',
      message: 'Change Logged in User',
    })
  })
  inquirer.prompt(stream).ui.process.subscribe({
    next: async (ans) => {
      const { name, answer } = ans
      switch (name) {
        case 'changeUser':
          if (answer) {
            console.log('Will run auth again here')
          }
          Emitter.next({
            type: 'file-tree-selection',
            name: 'changeHousing',
            message: 'Point me to house folder',
            onlyShowDir: true,
          })
          break
        case 'changeHousing':
          process.env.HF = answer
          fs.appendFileSync(path.resolve('./.env'), `\nHF=${answer}`)
          console.log('Update env with path -', answer)
          Emitter.next({
            type: 'input',
            name: 'changePrefix',
            message: 'new prefix word',
          })
          break
        case 'changePrefix':
          console.log('Update prefix here with-', answer)
          Emitter.complete()
          break
        default:
          break
      }
    },
    error: () => {},
    complete: (c) => {
      console.log('Project updated successfully')
      console.log(c)
    },
  })
}

const getAllFilesRecursively = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFilesRecursively(`${dirPath}/${file}`, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, '/', file))
    }
  })
  return arrayOfFiles
}

function convert() {
  const gitsubmodules = fs.readFileSync(path.resolve(".thefile"), {
    encoding: "utf-8",
  })
  // console.log(gitsubmodules);
  const regExp =
    /\[submodule\s*"(?<name>(.*?))"]\s*path\s=\s(?<path>[a-zA-Z_]+)\s*url\s=\s(?<url>[a-zA-Z_:/.-]+)/g
  const matches = gitsubmodules.matchAll(regExp)
  // console.log(matches);
  for (const iterator of matches) {
    // console.log(iterator);
    console.log(iterator.groups)
  }
}