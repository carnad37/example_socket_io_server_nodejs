const express = require('express');
const app = express();
const http = require('http');
var cors = require('cors')

const server = http.createServer(app);
const { Server } = require("socket.io");
const {json} = require("express");
const {createClient} = require("redis");
const io = new Server(server);

let count = 0
const redisClient = createClient({
  socket: {
    port: 16379,
    host: "192.168.1.87"
  }
});
redisClient.connect()

app.use(cors())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('testemit', (test) => {
    console.log('user testemit', test);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// socket:id,
const subCount = (arrayValue, socketId) => {
  if (!Array.isArray(arrayValue)) return 0

  // let filtering = null
  // if (params?.socketId) {
  //   filtering = (el) => {
  //     const dataArr = el.split(':')
  //     return dataArr[0] !== params.socketId
  //   }
  // } else if (params?.userKey) {
  //   filtering = (el) => {
  //     const dataArr = el.split(':')
  //     return dataArr[1] !== params.userKey
  //   }
  // }

  // if (filtering === null) return arrayValue.length
  return arrayValue.filter((el) => {
    const dataArr = el.split(':')
    return dataArr[0] !== socketId
  })
}

const addCount = (arrayValue, socketId, userKey) => {
  if (!Array.isArray(arrayValue)) arrayValue = []
  arrayValue = [...arrayValue, `${socketId}:${userKey}`]
  console.log('arrayValue', `${socketId}:${userKey}`)
  return arrayValue
}

const getCount = (arrayValue) => {
  const dataSet = new Set()
  arrayValue.forEach(el=>{
    const dataArr = el.split(':')
    dataSet.add(dataArr[1])
  })
  return dataSet.size
}

const getRealViewer = () => {

}

// const reservationNamespace = io.of('/reservation')
// reservationNamespace.on('connection', (socket) => {
//   socket.on('addViewer', async (jsonData)=>{
//     const parseData = JSON.parse(jsonData)
//     console.log(parseData)
//     count += 1
//     redisClient.get(socket.nsp.name).then(data=>{
//       let dataArr = data ? data.split(',') : []
//       dataArr = addCount(dataArr, socket.id, parseData.userKey)
//       console.log('addViewer', dataArr)
//       redisClient.set(namespace.name, dataArr.join(','))
//       const count = getCount(dataArr)
//       console.log('addViewer', count)
//       namespace.emit('viewer', count)
//     })
//   })
// })

const orderNamespace = io.of(/^\/room\/\w+/)
orderNamespace.use((socket, next)=>{
  next()
})
orderNamespace.on('connection', (socket) => {
  const namespace = socket.nsp

  socket.on('addViewer', async (jsonData)=>{
    const parseData = JSON.parse(jsonData)
    console.log(parseData)
    count += 1
    redisClient.get(socket.nsp.name).then(data=>{
      let dataArr = data ? data.split(',') : []
      dataArr = addCount(dataArr, socket.id, parseData.userKey)
      console.log('addViewer', dataArr)
      redisClient.set(namespace.name, dataArr.join(','))
      const count = getCount(dataArr)
      console.log('addViewer', count)
      namespace.emit('viewer', count)
    })
  })
  socket.on('subViewer', async (jsonData)=>{
    const parseData = JSON.parse(jsonData)
    count -= 1
    redisClient.get(socket.nsp.name).then(data=> {
      let dataArr = data ? data.split(',') : []
      dataArr = subCount(dataArr, socket.id)
      redisClient.set(namespace.name, dataArr.join(','))
      const count = getCount(dataArr)
      console.log('subViewer', count)
      namespace.emit('viewer', count)
    })
  })
  socket.on('disconnect', () => {
    console.log('disconnect')
    let dataArr = data ? data.split(',') : []
    dataArr = subCount(dataArr, socket.id)
    redisClient.set(namespace.name, dataArr.join(','))
    const count = getCount(dataArr)
    console.log('subViewer', count)
    namespace.emit('viewer', count)
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});