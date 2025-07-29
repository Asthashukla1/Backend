const { error } = require('console');
const fs = require('fs');   //its a commonJS modeule can be converted into ES6
const http = require('http')
const server = http.createServer(function(req,res){
    res.end("Hello server")
})
server.listen(3000);