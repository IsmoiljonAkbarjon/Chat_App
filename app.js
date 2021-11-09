const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// bring routes
app.use("/user", require('./routes/user'))
app.use("/chatroom", require('./routes/chatroom'))

// errorHandlers
const errorHandlers = require('./handler/errorHandler')
app.use(errorHandlers.notFound)
app.use(errorHandlers.mongooseErrors)

if(process.env.ENV === "DEVELOPMENT"){
  app.use(errorHandlers.developmentErrors)
}else{
  app.use(errorHandlers.productionErrors)
}


module.exports = app
