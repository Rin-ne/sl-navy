const express = require("express")
const server  = express()
const http    = require("http").createServer(server)
const PORT    = process.env.PORT || 3000
const health  = require("express-ping")
const io      = require("socket.io")(http)
const bp      = require("body-parser")
const fs      = require("fs")

server.use( health.ping() )
server.use( bp({ limit: "10mb" }) )
server.use( bp.urlencoded() )
server.use( bp.urlencoded({ extended: true })) 

let numberOfConnectedClient = 0
let disconnectedClient = 0

server.get(
  "/",
  (request, response) => {
    response.send(numberOfConnectedClient.toString())
  }
)

server.get(
  "/test",
  (request, response) => {
    response.sendFile(__dirname + "/view/test.html")
  }
)

io.on(
  "connection",
  (socket) => {
    numberOfConnectedClient++
    console.log(numberOfConnectedClient)
    socket.on(
      "disconnect",
      () => {
        numberOfConnectedClient--
      }
    )
    socket.on(
      "video",
      ($) => {
        if (
          typeof $.receiver == "string"
          &&
          typeof $.data     == "string"
        ) {
          socket.broadcast.emit(
            $.receiver,
            JSON.stringify(
              {
                data : $.data,
                date : $.date,
                time : $.time,
              }
            )
          )
        }
      }
    )
  }
)

http.listen(
  PORT,
  () => {
    console.log("server started on port " + PORT)
  }
)
