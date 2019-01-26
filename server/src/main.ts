import * as express from 'express';
import * as socket_io from 'socket.io';
import * as file_upload from 'express-fileupload';
import * as fs from 'fs';

let app = express();
let http = require('http').Server(app);

let io = socket_io(http);

app.use(file_upload());
app.use(express.static('public'))

class User {
	name: string;
	id: string;
	image_path: string;

    constructor(id: string) {
		this.name = "";
		this.id = id;
		this.image_path = "";
    }

    setName = (name: string) : void => {
        this.name = name;
	}
	
	setImagePath = (path: string) : void => {
		this.image_path = path;
	}
};

class Room {
	id: number;
	users: Array<User>;

    constructor(id: number) {
        this.id = id;
        this.users = [];
    }

    addUser = (socket: socket_io.Socket) : User => {
        let user = new User(socket.id);
        this.users.push(user);
        return user;
    }

    removeUser = (user: User) => {
		fs.unlink(user.image_path, () => {console.log("User photo deleted")});
		let index = this.users.indexOf(user);

		if(index > -1) {
			this.users.splice(index, 1);
		} else {
			
		}
		
		console.log(this.users);
	}
	
	getUserFromID = (user_id: string) : User => {
		let result: Array<User> = this.users.filter((user: User) => {
			return user.id == user_id;
		})

		if(result.length > 0) {
			return result[0];
		}
		return undefined;
	}
};

let rooms: Array<Room> = new Array<Room>();

function getRoomFromID(id: number) : Room {
	let result: Array<Room> = rooms.filter((room: Room) => {
		return room.id == id;
	})
	if(result.length > 0) return result[0];
	return undefined;
}
io.on("connection", (socket) => {
    console.log("User connected");
	let user: User = undefined;
	let room: Room = undefined;
    socket.on("join_room", (data, callback) => {
        room = getRoomFromID(data);
        if(room !== undefined) {
            socket.join(data);
            user = room.addUser(socket);
            callback(true, user.id);
        } else {
            callback(false);
        }
        
    });

    socket.on("set_name", (data) => {
        user.setName(data);
	});
	
	socket.on("disconnect", () => {
		console.log("User disconnected");
		if(room !== undefined)
			room.removeUser(user);
	});
});

app.get('/', (req, res) => {
    res.send(io.sockets.adapter.rooms);
});

function genRoomID() {
    let found = false;
    let id = 0;
    while(!found) {
        id = parseInt((Math.random().toString().substr(2, 4)), 10);
        let room = getRoomFromID(id);
        found = (room === undefined || room === null);
    }
    return id;
}

app.get('/create', (req, res) => {
    let room_id = genRoomID();
    let room = new Room(room_id);
    rooms.push(room);
    console.log("Created room " + room_id);
    res.redirect("/view/" + room_id);
});

app.get('/view/:room_id', (req, res) => {
    // res.send(io.sockets.adapter.rooms[req.params.room_id]);
    // res.send(io.sockets.clients(req.params.room_id));
    res.send(getRoomFromID(req.params.room_id));
})

app.post('/set_user_data', (req, res) => {
	let user_id = req.body.user_id;
	let room_id = req.body.room_id;
	let username = req.body.username;
	let image_path = "";

	if(req.files.image !== undefined && user_id !== undefined) {
		let image: any = req.files.image;
		let extension_start = image.name.lastIndexOf('.');
		let extension = image.name.substr(extension_start, image.name.length - extension_start);
		image_path = "public/images/" + user_id + extension;
		fs.writeFileSync(image_path, image.data);
	} else {
		console.log("Either image or user_id were undefined");
	}

	let room = getRoomFromID(room_id);
	if(room !== undefined) {
		let user = room.getUserFromID(user_id);
		if(user !== undefined) {
			user.setImagePath(image_path);
			user.setName(username);
		} else {
			console.log("Couldn't find user in room");
		}
	} else {
		console.log("Couldn't find room " + room_id);
	}
});

http.listen(8080, () => {
    console.log("Listening on port 8080");
});