// eslint-disable-next-line prefer-destructuring
let duration = process.argv.slice(2)[0]
process.on("message", (m) => {
  // console.log(m);
  if (m === "KILLTIMER") {
    clearInterval(Timer)
    process.exit(0)
  }
})
function stop() {
  clearInterval(Timer)
  console.log("OTP expired!!")
  process.send("STOP")
  process.exit(0)
}
const Timer = setInterval(() => {
  duration ? duration-- : stop()
}, 1000)
