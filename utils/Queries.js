// eslint-disable-next-line no-unused-vars
const { AxiosResponse } = require('axios')

/**
 * @typedef QueryTransformReturn
 * @type {Object}
 * @property hasNextPage {boolean}
 * @property hasPreviousPage {boolean}
 * @property startCursor {string}
 * @property endCursor {string}
 * @property list {[string]} List of names
 */

/**
 *
 * @param {AxiosResponse} response
 * @returns {QueryTransformReturn}
 */
const userReposTr = ({ data: { data } }, sieve) => {
  const list = data.user.repositories.edges
    .filter(sieve || Boolean)
    .map((r) => ({ name: r.node.name, value: r.node.id }))
  return { list, ...data.user.repositories.pageInfo }
}
const templateSieve = (r) => r.node.isTemplate
const userReposTrTemplate = (data) =>
  userReposTr.apply(null, [data, templateSieve])
const userReposTrURL = ({data:{data}})=>{
  const list = data.user.repositories.edges.map((r)=>({name:r.node.name,value:r.node.url}))
  return {list,...data.user.repositories.pageInfo}
}

const userRepos = `
query($user:String!,$first:Int,$last:Int,$before:String,$after:String){
    user(login: $user) {
      repositories(first:$first,last:$last,before:$before,after:$after, affiliations: [ORGANIZATION_MEMBER, OWNER, COLLABORATOR], ownerAffiliations: [ORGANIZATION_MEMBER, OWNER, COLLABORATOR]) {
        totalCount
        pageInfo{
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        edges {
          node {
            id
            isTemplate
            name
            description
            url
          }
        }
      }
    }
}
`
/**
 *
 * @param {AxiosResponse} response
 * @returns {QueryTransformReturn}
 */
const searchGitTr = ({ data: { data } }) => {
  const list = data.search.edges.map((r) => r.node.name)
  return { list, ...data.search.pageInfo }
}

const searchGit = `
query($first:Int,$last:Int,$before:String,$after:String,$query:String!){
    search(query:$query, type: REPOSITORY, first:$first,last:$last,before:$before,after:$after) {
    edges{
     node{
       ...on Repository{
         name  
         description
        }
      }
    }
    pageInfo{
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
`

/**
 *
 * @param {AxiosResponse} data
 * @returns {QueryTransformReturn}
 */
const userOrgsTR = ({ data: { data } }) => {
  const list = data.user.organizations.edges.map((v) => ({
    name: v.node.name,
    // split("/") -- To get name of org so it can be used
    // to get team list of organization in later prompt,
    // TODO -- if possible change choice object of inquirer to accomodate this,
    // and return ans with name and not just answer
    value: `${v.node.name}/${v.node.id}`,
  }))
  return { list, ...data.user.organizations.pageInfo }
}
const userOrgs = `
query($first:Int,$last:Int,$before:String,$after:String,$user:String!){
    user(login: $user) {
        organizations(first:$first,last:$last,before:$before,after:$after) {
            edges {
                node {
                    id
                    name
                }
            }
            pageInfo{
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
        }
    }
}
`

/**
 *
 * @param {AxiosResponse} data
 * @returns {QueryTransformReturn}
 */
const appBloxReposTR = ({ data: { data } }) => {
  const list = data.organization.repositories.edges.map((v) => v.node.name)
  return { list, ...data.organization.repositories.pageInfo }
}
const appBloxRepos = `
query($first:Int,$last:Int,$before:String,$after:String){
    organization(login: "appblox-lab") {
        id
        repositories(first:$first,last:$last,before:$before,after:$after) {
            edges {
                node {
                    id
                    isTemplate
                    name
                    description
                }
            }
            pageInfo{
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
        }
    }
}
`

/**
 *
 * @param {AxiosResponse} data
 * @returns {QueryTransformReturn}
 */
const listFlavoursTR = ({ data: { data } }) => {
  const list = data.repository.forks.edges.map((v) => v.node.name)
  return { list, ...data.repository.forks.pageInfo }
}
/**
 * owner and name
 */
const listFlavours = `
query($first:Int,$last:Int,$before:String,$after:String,$owner:String!,$name:String!){
    repository(owner:$owner,name:$name){
        forks(first:$first,last:$last,before:$before,after:$after){
            edges{
                node{
                    name
                    nameWithOwner
                    description
                }
            }
            pageInfo{
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
        }
    }
}
`

/**
 *
 * @param {AxiosResponse} response
 * @returns {QueryTransformReturn}
 */
const listVersionsTr = ({ data: { data } }) => {
  const list = data.repository.releases.edges.map((r) => r.node.name)
  return { list, ...data.repository.releases.pageInfo }
}
const listVersions = `
query($first:Int,$last:Int,$before:String,$after:String,$owner:String!,$name:String!){
    repository(owner:$owner,name:$name){
        releases(first:$first,last:$last,before:$before,after:$after){
            edges{
                node{
                    name
                    tagName
                }
            }
            pageInfo{
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
        }
    }
}
`
const listTeamsTr = ({ data: { data } }) => {
  const list = data.organization.teams.edges.map((r) => ({
    name: r.node.name,
    value: r.node.id,
  }))
  return { list, ...data.organization.teams.pageInfo }
}
const listTeams = `
query ($first:Int,$last:Int,$before:String,$after:String,) {
  organization(login: "appblox-lab") {
    teams(first:$first,last:$last,before:$before,after:$after) {
      edges {
        node {
          name
          id
        }
      }
      pageInfo{
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
}`

module.exports = {
  listVersions: { Q: listVersions, Tr: listVersionsTr },
  listFlavours: { Q: listFlavours, Tr: listFlavoursTR },
  searchGit: { Q: searchGit, Tr: searchGitTr },
  userRepos: { Q: userRepos, Tr: userReposTr, Tr_t: userReposTrTemplate,Tr_URL:userReposTrURL },
  userOrgs: { Q: userOrgs, Tr: userOrgsTR },
  appBloxRepos: { Q: appBloxRepos, Tr: appBloxReposTR },
  orgTeams: { Q: listTeams, Tr: listTeamsTr },
}
