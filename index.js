const express = require("express")
const mongodb = require("mongodb")
const server = express()
const http = require("http").createServer(server)
const PORT = process.env.PORT || 4000
const health = require("express-ping")
const io = require("socket.io")(http)
const bp = require("body-parser")
const fs = require("fs")

const MongoClient = mongodb.MongoClient
const uri = "mongodb+srv://SlimeDev:a1s2h3j4a5@cluster0-qnvfk.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db,
  collection
client.connect(err => {
  if(err) throw err
  console.log("connected to mongo database")
  db = client.db("stackedChat")
  collection = db.collection("slime")


  server.use(health.ping())
  server.use(bp({ limit: "10mb" }))
  server.use(bp.urlencoded())
  server.use(bp.urlencoded({ extended: true }))

  let numberOfConnectedClient = 0

  server.get(
    "/",
    (request, response) => {
      response.send(numberOfConnectedClient.toString())
    }
  )

  server.get(
    "/up",
    (request, response) => {

    }
  )

  server.get(
    "/chats",
    (request, response) => {
      if (typeof request.query.nomor == "string") {
        collection.find({ receiver: request.query.nomor }).toArray(
          (err, $) => {
            if (err) console.log(err)
            console.log($)
            response.send(JSON.stringify($))
            collection.deleteMany({receiver: request.query.nomor})
          }
        )
      }
      else {
        response.send("Err : Unknown query")
      }
    }
  )

  io.on(
    "connection",
    (socket) => {
      numberOfConnectedClient++
      socket.on(
        "test",
        () => {
          console.log(gottt)
        }
      )
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
            typeof $.data == "string"
          ) {
            socket.broadcast.emit(
              $.receiver,
              JSON.stringify(
                {
                  data: $.data,
                  date: $.date,
                  time: $.time,
                  sender: $.sender
                }
              )
            )
          }
        }
      )
      socket.on(
        "image",
        ($) => {
          socket.broadcast.emit(
            $.receiver,
            JSON.stringify(
              {
                data: $.data,
                date: $.date,
                time: $.time,
                sender: $.sender
              }
            )
          )
        }
      )
      socket.on(
        "store this chat please",
        ($, onError) => {
          console.log("got msg")
          if ($.type == "array") {
            collection.insertMany($.data)
          }
          else if ($.type == "object") {
            collection.insertOne($.data)
          }
          else {
            onError("Error : Unknown Data type")
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
});