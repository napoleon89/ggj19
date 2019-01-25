let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

io.on("connection", (socket) => {
    console.log("User connected");
});

app.get('/', (req, res) => {
    res.send("Hey there");
});

http.listen(8080, () => {
    console.log("Listening on port 8080");
})