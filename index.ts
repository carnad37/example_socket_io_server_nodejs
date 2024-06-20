import { SCENARIO_TYPE} from "./constans";
import { emitNamespaceViewer, emitRoomViewer} from "./utils";
import {scenarioConnect, scenarioSchedule} from "./scenario";
import {Socket} from "socket.io";

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const schedule = require('node-schedule');
const cors = require('cors')

// const {createClient} = require("redis");
// const redisClient = createClient({
//   socket: {
//     port: 16379,
//     host: "192.168.1.87"
//   }
// });
// redisClient.connect()

let scenarioFlag = false
let currentScenario: null | SCENARIO_TYPE = null
for (const arg of process.argv) {
  if (scenarioFlag) {
    const scenario = arg as SCENARIO_TYPE
    if (scenario !== 'schedule' && scenario !== 'connect') {
      throw new Error('no match scenario. cant not init server')
    }
    currentScenario = scenario
    break
  } if (['--scenario', '-s'].includes(arg)) {
    scenarioFlag = true
  }
}
if (currentScenario === null) {
  throw new Error('no match scenario. cant not init server')
}


const app = express();
const server = http.createServer(app);
const io = new Server(server);
// cors 모두 허용
app.use(cors())

// socket.io
const orderNamespace = io.of('/room')
orderNamespace.on('connection',
  currentScenario === 'schedule'
    ? (socket: Socket)=>scenarioSchedule(socket)
    : (socket: Socket)=>scenarioConnect(socket, orderNamespace));


server.listen(4000, () => {
  console.log('socket.io 서버 기동 *:4000');

  if (currentScenario === 'schedule') {
    console.log('push용 스케쥴러 작동');
    schedule.scheduleJob('*/3 * * * * *', function () {
      emitNamespaceViewer(orderNamespace)
    });
  }
});

