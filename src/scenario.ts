import type {Namespace, Socket} from "socket.io";
import {ROOM_ID_PREFIX} from "./constans";
import {cookieParser, emitRoomViewer} from "./utils";
import {type ViewerType} from "../types/common-type";


const scenarioCommon = (socket: Socket, namespace: Namespace) => {
  const queryRoom = socket.handshake.query['room']
  if (queryRoom) {
    const roomNo = ROOM_ID_PREFIX + queryRoom
    socket.join(roomNo)
    socket.data.roomNo = roomNo
  }
  const jsonCookie = cookieParser(socket.handshake.headers.cookie)
  if (jsonCookie.userKey) {
    socket.data.userKey = jsonCookie.userKey
  }
  // else {
  //   // 유저키가 없는 유청은 연결시키지 않는다.
  //   socket.disconnect()
  // }
}

const scenarioSchedule = (socket: Socket, namespace: Namespace) => {
  scenarioCommon(socket, namespace)
}

const scenarioConnect = (socket: Socket, namespace: Namespace) => {
  scenarioCommon(socket, namespace)
  socket.on('addViewer', async (jsonData: string | ViewerType)=>{
    const params = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    if (params.userKey) {
      socket.data.userKey = params.userKey
    }
    if (params.room) {
      const roomNo =`${ROOM_ID_PREFIX}${params.room}`
      if (namespace.adapter.rooms.get(roomNo)?.has(socket.id) === false) {
        socket.join(roomNo)
        socket.data.roomNo = roomNo
      }
      emitRoomViewer(namespace, roomNo)
    }
  })
  socket.on('disconnect', ()=>{
    emitRoomViewer(namespace, socket.data.roomNo)
  })
}

export {scenarioCommon, scenarioConnect, scenarioSchedule}