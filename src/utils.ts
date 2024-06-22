import {Namespace} from "socket.io";
import {ROOM_ID_PREFIX, VIEWER_EVENT} from "./constans";

const emitNamespaceViewer = (namespace: Namespace) => {
  for (const [ roomNo, socketSet ] of namespace.adapter.rooms.entries()) {
    if (roomNo.startsWith(ROOM_ID_PREFIX)) {
      if (socketSet.size < 1) continue
      namespace.to(roomNo).emit(VIEWER_EVENT, getRoomViewer(namespace, socketSet))
    }
  }
}

const emitRoomViewer = (namespace: Namespace, roomNo: string) => {
  const socketIdSet = namespace.adapter.rooms.get(roomNo)
  if (socketIdSet) {
    const count = getRoomViewer(namespace, socketIdSet)
    namespace.to(roomNo).emit(VIEWER_EVENT, count)
  }
}

const getRoomViewer = (namespace: Namespace, socketIdSet: Set<string>) => {
  const countSet = new Set()
  for (const socketId of socketIdSet) {
    const tUserkey = namespace.sockets.get(socketId).data.userKey
    countSet.add(tUserkey)
  }
  console.log('countSet', countSet)
  return countSet.size
}

const cookieParser = (cookie: string): Record<string, string> => {
  if (!cookie) return {} as Record<string, string>
  const cookieArr = cookie.split('; ')
  return cookieArr.reduce((previousValue, currentValue, currentIndex, array)=>{
    const targetIdx = currentValue.indexOf('=')
    previousValue[currentValue.substring(0, targetIdx)] = currentValue.substring(targetIdx + 1)
    return previousValue
  }, {} as Record<string, string>)
}

export {emitRoomViewer, getRoomViewer, emitNamespaceViewer, cookieParser}