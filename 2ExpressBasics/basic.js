import express from 'express'

const app = express() //jo jo express krta h ab app bhi kar skta h

app.get('/', (req, res) => { // '/' default route h
  res.send('Hello Astha World')
})

app.listen(3000)