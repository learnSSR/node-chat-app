//const messages = require("../../src/utils/messages")

const socket = io()

//Elements
const $messageForm        = document.querySelector('#message-form')
const $messageFormInput   = $messageForm.querySelector('input')
const $messageFormButton  = $messageForm.querySelector('button')
const $sendlocationButton = document.querySelector('#send-location')
const $messages           = document.querySelector('#messages')
const $sidebar				  = document.querySelector('#sidebar')

//Option
const {username ,room } = Qs.parse(location.search, { ignoreQueryPrefix : true})

//templates
const messageTemplate    = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const autoscroll = () => {
	// new message element
	const $newMessage = $messages.lastElementChild

	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	//visible 
	const visibleHeight = $messages.offsetHeight

	// height of message container
	const containerHeight = $messages.scrollHeight

	// how far i reached
	const scrollOfset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOfset) {
		$messages.scrollTop = $messages.scrollHeight
	}
	console.log($newMessage)
	console.log(newMessageMargin)
	console.log(newMessageHeight)
}

socket.on('message' , (message) => {
	console.log(message)
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

socket.on('sendLocation' , (url) => {
	//console.log(url)
	const html = Mustache.render(locationMessageTemplate,{
		username: url.username,
		url: url.text,
		createdAt: moment(url.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

socket.on('roomData' , ({room , users}) => {
	const html = Mustache.render(sidebarTemplate,{
		room,
		users,
	})
	$sidebar.innerHTML = html

	// console.log(room)
	// console.log(users)
})

$messageForm.addEventListener('submit' , (e) => {
	e.preventDefault()
	// disable
	$messageFormButton.setAttribute('disabled','disabled')
	
	const message = e.target.elements.message.value
	if (!message){
		$messageFormButton.removeAttribute('disabled')
		return
	}
	socket.emit('sendMessage' ,message, (error) => {
		//enable
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus()

		if (error){
			return console.log(error)
		}

		console.log('message delivered')
	})
})

document.querySelector('#send-location').addEventListener('click' , ()=>{
	
	if (!navigator.geolocation)
	  return alert('not supported')

	  $sendlocationButton.setAttribute('disabled','disabled')

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendLocation',{
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		} , () => {

			$sendlocationButton.removeAttribute('disabled')

			console.log('location Shared!')
		})
	})
})


socket.emit('join' , {username ,room} ,(error) => {
	if (error) {
		alert(error)
		location.href='/'
	}
})