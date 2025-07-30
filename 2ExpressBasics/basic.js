import { log } from 'console';
import express from 'express'

const app = express() //jo jo express krta h ab app bhi kar skta h

app.use(function(req,res,next){
    console.log("middleware chala")
    next();
})

app.get('/', (req, res) => { // '/' default route h
  res.send('Hello Astha World')
})

app.listen(3000)