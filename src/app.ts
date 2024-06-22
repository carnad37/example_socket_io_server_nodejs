import { emitNamespaceViewer, emitRoomViewer} from "./utils";
import {scenarioConnect, scenarioSchedule} from "./scenario";
import {Socket} from "socket.io";
import {SCENARIO_TYPE} from "../types/common-type";
import {createAdapter, createShardedAdapter} from "@socket.io/redis-adapter";

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const schedule = require('node-schedule');
const cors = require('cors')

const {createClient} = require("redis");
const redisClient = createClient({
  socket: {
    port: 16379,
    host: "192.168.1.87"
  }
});
const subClient = redisClient.duplicate();

let scenarioFlag = false
let portFlag = false
let currentScenario: null | SCENARIO_TYPE = null
let currentPort = 4000
console.log(process.argv)
for (const arg of process.argv) {
  if (scenarioFlag) {
    const scenario = arg as SCENARIO_TYPE
    if (scenario !== 'schedule' && scenario !== 'connect') {
      throw new Error('no match scenario. cant not init server')
    }
    currentScenario = scenario
    scenarioFlag = false
  } else if (portFlag) {
    try {
      currentPort = parseInt(arg)
    } catch (e) {
      currentPort = 4000
    }
    portFlag = false
  }

  if (['--scenario', '-s'].includes(arg)) {
    scenarioFlag = true
  } else if (['--port', '-p'].includes(arg)) {
    portFlag = true
  }
}
if (currentScenario === null) {
  throw new Error('no match scenario. cant not init server')
}

Promise.all([
  redisClient.connect(),
  subClient.connect()
]).then(async ([a1, a2])=>{
  // 특정 socket 서버에서 관리되는 타겟 정보 생성.
  // 특정 socket 서버가 재기동시에 해당 정보들에대해서 update 실행.
  const server = http.createServer()
  const io = new Server({
    server,
  });
// cors 모두 허용
// socket.io
  const orderNamespace = io.of('/room')
  orderNamespace.on('connection',
    currentScenario === 'schedule'
      ? (socket: Socket)=>scenarioSchedule(socket, orderNamespace)
      : (socket: Socket)=>scenarioConnect(socket, orderNamespace));

// if (currentScenario === 'schedule') {
  console.log('push용 스케쥴러 작동');
  schedule.scheduleJob('*/3 * * * * *', function () {
    // io.of('/').adapter.allRooms()

    console.log('test', orderNamespace.adapter.rooms)
    // orderNamespace.emit('getCount', 3)
  });
// }

  io.listen(currentPort);
})

