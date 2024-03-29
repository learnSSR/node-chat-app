// Types of Events
// socket.emit                --> send events to particular clients
// io.emit                    --> which send event to every connected client 
// socket.broadcast.emit      --> which send event to every connected client except to one 
// 
// io.to.emit                 --> 
// socket.broadcast.to.emit   -->  



const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const messages = require('./utils/messages')
const{ addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)
 
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))



io.on('connection' , (socket) => {
	console.log('New Websocket connection')

	socket.on('join' , ({ username , room }, callback) =>{
			const { error , user } = addUser({ id: socket.id, username, room})
			 
			if (error) {
				return callback(error)
				
			}

		    socket.join(user.room)

			socket.emit('message', generateMessage(`Admin`,'Welcome!'))
			socket.broadcast.to(user.room).emit('message' , generateMessage(`Admin`,`${user.username} has joined!`))
			io.to(user.room).emit('roomData' ,{
				room : user.room,
				users: getUserInRoom(user.room)
			})

			callback()
     })

	socket.on('sendMessage' , ( message , callback) => {
		const user = getUser(socket.id)
		const filter = new Filter()

		if (filter.isProfane(message)){
			return callback('Profanity is not allowed!')
		}

		io.to(user.room).emit('message' ,generateMessage(user.username,message))
		callback()
	})

	socket.on('sendLocation' , (coords , callback) => {
		const user = getUser(socket.id)
		io.to(user.room).emit('sendLocation' ,generateMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
		callback()
	})

	socket.on('disconnect' , ()=> {
		const user = removeUser(socket.id)
	
		if (user) {
			io.to(user.room).emit('message' , generateMessage( `Admin`,`${user.username} has left!`))
			io.to(user.room).emit('roomData' ,{
				room : user.room,
				users: getUserInRoom(user.room)
			}) 
		}
	})
})





server.listen(process.env.PORT || 3000, () => {
    console.log(`Server is up on port ${process.env.PORT}.`)
})

