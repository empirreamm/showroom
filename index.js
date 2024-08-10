import "dotenv/config"
import express from 'express'
import fs from "node:fs"

console.clear()
const app = express()
app.use(express.json(
  {
    limit: '1gb'
  }
))

app.use(express.static('public', {
  extensions: ['html'],
}))


app.post("/save", (req, res) => {
  const { data } = req.body
  fs.writeFileSync("./public/data.sr", data)
  res.send("Saved")
})
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})