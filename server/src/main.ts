import * as express from 'express';
import * as socket_io from 'socket.io';
import * as file_upload from 'express-fileupload';
import * as fs from 'fs';
import { stringify } from 'querystring';
import { userInfo } from 'os';

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

class Round {
	setup: string;
	puns: Array<{user_id: string, pun: string}>;
	all_puns_submitted: boolean;
	all_votes_submitted: boolean;
	winners_id: Array<string>;
	votes: Array<{user_id: string, voted_user_id: string}>; // user ids

	constructor() {
		this.puns = new Array<{user_id: string, pun: string}>();
		this.all_puns_submitted = false;
		this.votes = new Array<{user_id: string, voted_user_id: string}>(); 
		this.winners_id = new Array<string>();
	}

	addPun = (user_id: string, pun: string) : void => {
		this.puns.push({user_id, pun});
	}

	hasUserPunned = (user_id: string) : boolean => {
		let result = this.puns.filter((pun_user) => {
			return pun_user.user_id === user_id;
		});
		return result.length > 0;
	}

	vote = (user_id: string, vote_id: string) : void => {
		this.votes.push({user_id: user_id, voted_user_id: vote_id});
	}

	calcWinner = () : Array<string> => {
		let largest_vote_count = 0;
		for(let i = 0; i < this.puns.length; i++) {
			let user_id = this.puns[i].user_id;
			let result = this.votes.filter((vote) => {
				return vote.voted_user_id == user_id;
			});
			if(result.length > largest_vote_count) {
				largest_vote_count = result.length;
			}
		}

		let results = new Array<string>();

		for(let i = 0; i < this.puns.length; i++) {
			let user_id = this.puns[i].user_id;
			let result = this.votes.filter((vote) => {
				return vote.voted_user_id == user_id;
			});
			if(result.length === largest_vote_count) {
				results.push(user_id);
			}
		}

		return results;
		
	}
};

class Room {
	id: number;
	users: Array<User>;
	current_round: Round;
	admin_id: string;

    constructor(id: number) {
        this.id = id;
		this.users = [];
	}
	
	startRound = () : void => {
		let round: Round = new Round();
		this.current_round = round;
		this.admin_id = this.users[Math.floor(Math.random() * this.users.length)].id;
		
		this.update();
		this.emitEvent("round_start");
	}

    addUser = (socket: socket_io.Socket) : User => {
        let user = new User(socket.id);
		this.users.push(user);
		this.update();
		return user;
    }

    removeUser = (user: User) => {
		if(user !== undefined) {
			fs.unlink(user.image_path, () => {console.log("User photo deleted")});
			let index = this.users.indexOf(user);

			if(index > -1) {
				this.users.splice(index, 1);
			} else {
				
			}
		} else {
			console.log("Attempting to delete undefined user");
		}
		
		
		console.log(this.users);
		this.update();
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

	update = () : void => {
		this.emitEvent("room_change");
	}

	emitEvent = (message: string) : void => {
		io.to(this.id.toString()).emit(message, this);
	}

	isJoinable = () : boolean => {
		return this.current_round == undefined || this.current_round == null;
	}

	allPunsSubmitted = () : boolean => {
		let result = true;
		for(let i = 0; i < this.users.length; i++) {
			if(this.users[i].id == this.admin_id) continue;
			if(!this.current_round.hasUserPunned(this.users[i].id)) {
				result = false;
				break;
			}
		}
		return result;
	}

	allVotesSubmitted = () : boolean => {
		let result = true;
		for(let i = 0; i < this.users.length; i++) {
			let results: Array<{user_id: string, voted_user_id: string}> = this.current_round.votes.filter((vote) => {
				return vote.user_id == this.users[i].id;
			});
			if(results.length === 0) {
				result = false;
				break;
			}
		}
		return result;
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
		console.log("Trying to find room");
		room = getRoomFromID(data);
		console.log("Found room");
        if(room !== undefined && room.isJoinable()) {
			console.log("Joining room");
            socket.join(data);
			user = room.addUser(socket);
			console.log("joined room");
            callback(true, user.id);
        } else {
            callback(false);
		}
		console.log(room);
        
	});
	
	socket.on("view_room", (room_id, callback) => {
		console.log("Viewing room");
		socket.join(room_id);
		let room: Room = getRoomFromID(room_id);
		if(room !== undefined) {
			console.log("Emitting room update");
			callback(room);
		}
	});

	socket.on("try_round_start", (room_id) => {
		let room: Room = getRoomFromID(room_id);
		room.startRound();
	})

	socket.on("set_round_setup", (setup) => {
		room.current_round.setup = setup;
		room.update();
		room.emitEvent("players_begin");
	})

	socket.on("pun_submit", (pun) => {
		room.current_round.addPun(user.id, pun);
		if(room.allPunsSubmitted()) {
			room.current_round.all_puns_submitted = true;
		}
		room.update();
	})
	
	socket.on("vote", (user_id) => {
		room.current_round.vote(user.id, user_id);
		if(room.allVotesSubmitted()) {
			room.current_round.all_votes_submitted = true;
		}
		room.update();
	})

	socket.on("disconnect", () => {
		console.log("User disconnected");
		if(room !== undefined)
			room.removeUser(user);
	});

	socket.on("create_room", (callback) => {
		let room_id = genRoomID();
		let room = new Room(room_id);
		rooms.push(room);
		console.log("Created room " + room_id);
		callback(room_id);
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

app.post('/set_user_data', (req, res) => {
	let user_id = req.body.user_id;
	let room_id = req.body.room_id;
	let username = req.body.username;
	let image_path = "";

	if(req.files !== null && req.files.image !== undefined && req.files.image !== null && user_id !== undefined) {
		let image: any = req.files.image;
		let extension_start = image.name.lastIndexOf('.');
		let extension = image.name.substr(extension_start, image.name.length - extension_start);
		image_path = "/images/" + user_id + extension;
		fs.writeFileSync("public" + image_path, image.data);
	} else {
		console.log("Either image or user_id were undefined");
	}

	let room = getRoomFromID(room_id);
	if(room !== undefined) {
		let user = room.getUserFromID(user_id);
		if(user !== undefined) {
			user.setImagePath(image_path);
			user.setName(username);
			room.update();
		} else {
			console.log("Couldn't find user in room");
		}
	} else {
		console.log("Couldn't find room " + room_id);
	}
	res.send("ok");
});

http.listen(8080, () => {
    console.log("Listening on port 8080");
});