
const {userOrgs,userRepos} = require('./Queries')

function getTemplate() {
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
        source: new NewLS(userRepos.Q, userRepos.Tr_t).sourceAll,
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
        source: new NewLS(userOrgs.Q, userOrgs.Tr).sourceB,
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

  
function getRepoURL() {
    const question = [
      {
        type: "customList",
        name: "selectRepo",
        message: "select a repo",
        choices: [], //give empty list, loads initial set
        source: new newls(userRepos.Q, userRepos.TrURL).sourceAll,
        pageSize: 22,
      },
    ]
    return inquirer.prompt(question).then((ans) => ans.selectRepo)
  }

  function WipeAllConfirmation() {
    return inquirer.prompt({
      type: 'confirm',
      message: 'There are files,Do you want to wipe all',
      name: 'wipeAll',
    })
  }

  module.exports={
    WipeAllConfirmation,getOrgId,getRepoURL,getTemplate
  }