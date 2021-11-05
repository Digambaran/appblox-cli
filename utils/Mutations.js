const cloneTr = ({ data }) => data.cloneTemplateRepository.repository.url
const clone = `mutation($description:String, $templateRepo:String!,$owner:String!,$name:String!,$visibility:String!){
    cloneTemplateRepository(input: { description:$description, repositoryId: $templateRepo, name: $name, ownerId: $owner, visibility: $visibility}) {
      repository {
        id
        mirrorUrl
        resourcePath
        url
        name
      }
    }
  }`

const createTr = ({ data }) => data.createRepository.repository.url
const create = `mutation( $template:Boolean, $description:String, $team:String,$owner:String!,$name:String!,$visibility:String!){
  createRepository(input: {template:$template, description:$description, ownerId: $owner, teamId: $team, name: $name, visibility: $visibility}){
    repository{
      name
      url
    }
  }
}`
module.exports = {
  cloneTemplateRepository: { Q: clone, Tr: cloneTr },
  createRepository: { Q: create, Tr: createTr },
}
