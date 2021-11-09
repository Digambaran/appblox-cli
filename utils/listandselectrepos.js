/* eslint-disable prefer-rest-params */
const axios = require('axios')
const inquirer = require('inquirer')
inquirer.registerPrompt('autocomplete', require('./inquirerAutocomplete'))

class lx {
  constructor(query, queryTransform) {
    this.Query = query
    this.QueryTransform = queryTransform
    this.Next = false
    this.Previous = false
    this.Before = null
    this.After = null
    this.Last = null
    this.First = null
    this.result = []
    this.sourceB = this.source.bind(this)
    this.sourceAll = this.sourceAll.bind(this, null, null, null, 'all')
  }
  // to give back a bound source function
  // that has access to this.
  // so the sourceFn can access state variables of instance

  sourceB(...args) {
    return lx.sourceFn.apply(this, args)
  }

  sourceAll(...args) {
    return lx.sourceFn.apply(this, args)
  }

  // eslint-disable-next-line consistent-return
  static async sourceFn() {
    const apiGraph = ' https://api.github.com/graphql'
    const headersV4 = {
      'Content-Type': 'application/json',
      // 'Authorization': 'bearer ' + obj['access_token'],
      Authorization: `bearer ${process.env.TOKEN}`,
      Accept: 'application/vnd.github.v4+json',
    }
    // console.log(arguments)

    const loadNextPage = arguments[2] === 'after'
    const loadPreviousPage = arguments[2] === 'before'
    const loadAll = arguments[3] === 'all'

    // To avoid making call with both before and after cursors
    if (loadNextPage) {
      this.Before = null
      this.First = 20
      this.Last = null
    }
    if (loadPreviousPage) {
      this.After = null
      this.Last = 20
      this.First = null
    }
    if (!this.Before && !this.After) this.First = 20 // for initial call

    try {
      /**
       * Named IIFE to make recursive call possible to get all page results
       */
      const res = await async function call() {
        const response = await axios.post(
          apiGraph,
          {
            query: this.Query,
            variables: {
              // always pass owner and username also, graph doesnt mind
              before: this.Before,
              after: this.After,
              last: this.Last,
              first: this.First,
              query: arguments[1] || null,
              user: process.env.USER || null,
              login: arguments[4] || null,
            },
          },
          { headers: headersV4 }
        )
        // console.log(response.data)
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message)
        }
        const { hasNextPage, hasPreviousPage, startCursor, endCursor, list } =
          this.QueryTransform(response)
        this.Next = hasNextPage
        this.Previous = hasPreviousPage
        this.After = endCursor
        if (hasNextPage && loadAll) {
          return [...list, ...(await call.apply(this))]
        }
        // Don't set this.Before, before the above if.that will result in
        // graphql query made with both before and after..results in error
        this.Before = startCursor
        return list
      }.bind(this)()

      // console.log(res)

      if (!loadAll) {
        this.result.length = 0
        if (this.Previous)
          this.result.push({ name: 'LoadPrev', disabled: false })
        this.result.push(...res)
        if (this.Next) this.result.push({ name: 'LoadMore', disabled: false })
      } else {
        this.result = [...res]
      }
      return this.result
    } catch (e) {
      // console.log(e)
      // TODO -- Handle network call gracefully
      // TODO -- log here
      console.log('Something went wrong!')
      process.exit(1)
      // return []
    }
  }
}
module.exports = {
  NewLS: lx,
}
