const express = require("express")
const mongodb = require("mongodb")
const server = express()
const http = require("http").createServer(server)
const PORT = process.env.PORT || 4000
const health = require("express-ping")
const cors = require("cors")
const io = require("socket.io")(http)
const bp = require("body-parser")
const fs = require("fs")
const fetch = require("node-fetch")

const MongoClient = mongodb.MongoClient
const uri = "mongodb+srv://SlimeDev:a1s2h3j4a5@cluster0-qnvfk.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db,
  collection,
  coinDb,
  coinCollection
client.connect(err => {
  if(err) throw err
  console.log("connected to mongo database")
  db = client.db("stackedChat")
  coinDb = client.db("slime")
  collection = db.collection("slime.cmd")
  coinCollection = coinDb.collection("coins")


  server.use(health.ping())
  server.use(bp({ limit: "10mb" }))
  server.use(bp.urlencoded())
  server.use(bp.urlencoded({ extended: true }))
  server.use(cors())
  let numberOfConnectedClient = 0

  server.get(
    "/",
    (request, response) => {
      response.send(numberOfConnectedClient.toString())
    }
  )
  server.get(
    "/getCoins",
    (request, response) => {
      response.setHeader('Content-Type', 'application/json');
      const nomor = request.query.nomor
      if(nomor === undefined || nomor == null){
        response.send("Wrong Query")
        return
      }
      const res = coinCollection.find({username : nomor}).toArray(
        (err, $) => {
          if (err) console.log(err)
          console.log($)
          if($ === undefined || $.length == 0){
            fetch("https://random-word-api.herokuapp.com/word")
            .then($=>$.json())
            .then($=>{
              client.db("slime").collection("coins").insertOne({
                username:nomor,
                coins:0,
                password:$[0]
              })
            })
          }
          response.json($[0])
        }
      )
    }
  )

  server.get(
    "/addCoin",
    (request, response) => {
      const nomor = request.query.nomor
      const passedToken = request.query.token
      if(nomor === undefined || nomor == null || passedToken == null || passedToken === undefined){
        response.send("Wrong Query")
        return
      }
      client.db("slime").collection("coins").find({username:nomor}).toArray((e, $)=>{
        if(e) throw e
        const data = $[0]
        let char = data.password.split("")
        const test = (chare)=>{
          if(chare.length <= 40){
            char = char.concat(char)
            return test(char)
          }else{
            return char
          }
        }
        const chara = test(char)
        console.log(chara)
        const d = new Date()
        let time = ""+d.getFullYear()+d.getMonth()+d.getDate()+d.getHours()+d.getSeconds()
        console.log(time)
        time = time.split("")
        const realToken = []
        time.forEach((t)=>{
          realToken.push(chara[Number.parseInt(t)])
        })
        console.log(realToken.join(""))
        if(passedToken !== realToken.join("")){
          response.send("Wrong Query")
          console.log(time.join(""))
        }else{
          client.db("slime").collection("coins").updateOne({username:nomor}, {$inc:{coins:1}})
          response.send("ok")
        }
      })
      
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