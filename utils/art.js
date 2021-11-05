const figlet = require("figlet")
module.exports = function Art(n) {
  figlet(n, { font: "Colossal" }, function (err, data) {
    if (err) {
      console.log("Something went wrong...")
      console.dir(err)
      //fallback print
      console.log(n)
      return
    }
    console.log(data)
  })
}
