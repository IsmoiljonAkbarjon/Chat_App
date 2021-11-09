require('dotenv').config()

const mongoose = require('mongoose')

mongoose.connect(process.env.DATABASE , {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on("error", (err)=>{
  console.log("Mongoose connection error " + err.message);
})

mongoose.connection.once('open', ()=>{
  console.log("Mongodb connected");
})

// bring models
require('./models/user')
require('./models/chatroom')
require('./models/message')

const app = require('./app')
const jwt = require('jwt-then');

const Message = mongoose.model("Message")
const User = mongoose.model("User")


const server = app.listen(8000, ()=>{
  console.log('server run 8000');
})

const { Server } = require("socket.io");
const io = new Server(server);

//WebSocket

io.use(async (socket,next)=>{
  try {
    const token = socket.handshake.query.token
    const payload = await jwt.verify(token, process.env.SECRET)
    socket.userId = payload.id
    next()
  } catch (error) {}
})

io.on('connection', (socket)=>{
  console.log('connected' + socket.userId);
  
  socket.on('disconnect', ()=>{
    console.log('disconnected' + socket.userId);
  })

  socket.on("joinRoom", ({chatRoomId})=>{
    socket.join(chatRoomId)
    console.log("user joined chatroom" + chatRoomId);
  })

  socket.on("leaveRoom", ({chatRoomId})=>{
    socket.leave(chatRoomId)
    console.log("user left chatroom" + chatRoomId);
  })

  socket.on("chatroomMessage", async ({chatRoomId, message})=>{

    if(message.trim().length > 0){
      const user = await User.findOne({id: socket.userId})
      const message = new Message({chatroom: chatRoomId, user: socket.userId, message})

      io.to(chatRoomId).emit("new Message", {
        message,    
        name: user.name,
        userId: socket.userId 
      })
      await message.save()
    }
  })
})
