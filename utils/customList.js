const ListPrompt = require('inquirer/lib/prompts/list')
const Choices = require('inquirer/lib/objects/choices')
const observe = require('inquirer/lib/utils/events')
const incrementListIndex = require('inquirer/lib/utils/incrementListIndex')
const { takeWhile, flatMap, map } = require('rxjs')
const cliCursor = require('cli-cursor')
const runAsync = require('run-async')
/**
 * in choices option pass empty array so a first set of page is loaded automatically,
 * else error
 */
class CustomList extends ListPrompt {
  constructor(questions, rl, answers) {
    super(questions, rl, answers)
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb

    const self = this
    const notAnswered = () => this.status !== 'answered'
    const events = observe(this.rl)

    events.normalizedUpKey
      .pipe(takeWhile(notAnswered))
      .forEach(this.onUpKey.bind(this))

    events.normalizedDownKey
      .pipe(takeWhile(notAnswered))
      .forEach(this.onDownKey.bind(this))

    events.numberKey
      .pipe(takeWhile(notAnswered))
      .forEach(this.onNumberKey.bind(this))

    events.line
      .pipe(
        takeWhile(notAnswered),
        map(this.getCurrentValue.bind(this)),
        flatMap((value) =>
          runAsync(self.opt.filter)(value, self.answers).catch((err) => err)
        )
      )
      .forEach(this.onSubmit.bind(this))

    // Init the prompt
    cliCursor.hide()
    if (self.firstRender) {
      Promise.resolve(self.opt.source(null, null, null)).then((
        choices
      ) => {
        self.opt.choices = new Choices(choices)
        self.render()
      })
    }
    self.render()

    return this
  }

  onUpKey() {
    this.selected = incrementListIndex(this.selected, 'up', this.opt)
    this.render()
  }

  onDownKey() {
    this.selected = incrementListIndex(this.selected, 'down', this.opt)
    this.render()
  }

  onNumberKey(input) {
    if (input <= this.opt.choices.realLength) {
      this.selected = input - 1
    }
    this.render()
  }

  onSubmit(value) {
    const self = this
    switch (value) {
      case 'LoadMore':
        return Promise.resolve(this.opt.source(null, null, 'after')).then(
          (choices) => {
            self.opt.choices = new Choices(choices)
            self.selected = 0
            self.render()
          }
        )
      case 'LoadPrev':
        return Promise.resolve(this.opt.source(null, null, 'before')).then(
          (choices) => {
            self.opt.choices = new Choices(choices)
            self.selected = 0
            self.render()
          }
        )
      default:
        self.status = 'answered'
        // Rerender prompt
        self.render()
        self.screen.done()
        cliCursor.show()
        self.done(value)
        break
    }
  }
}

module.exports = CustomList
