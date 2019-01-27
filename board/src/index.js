import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter as Router, Route, Link, Navigation} from 'react-router-dom';
import * as io from 'socket.io-client';

class RoomView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			room: undefined,
		}
	}

	componentDidMount() {
		this.props.socket.emit("view_room", this.props.match.params.room_id, (room) => {
			console.log("view room");
			console.log(room.current_round);
			console.log(room);
			this.setState({room: room});
		});
		this.props.socket.on("room_change", (room) => {
			this.setState({room: room});
		});
	}

	onRoundStart() {
		this.props.socket.emit("try_round_start", this.props.match.params.room_id);
	}

	render() {
		
		if(this.state.room !== undefined) {
			if(this.state.room.current_round !== undefined) {
				console.log(this.state.room.current_round.setup);
			} else console.log("Round hasn't started");
			return (
				<Fragment>
					{JSON.stringify(this.state.room.current_round)}
					{this.state.room.current_round !== undefined ? (
						<h3>{this.state.room.current_round.setup}</h3>
					) : (
						<button onClick={this.onRoundStart.bind(this)}>Start</button>
					)}
					{this.state.room.users.map((user) => {
						let user_has_punned = false;
						let user_has_voted = false;
						if(this.state.room.current_round !== undefined) {
							let result = this.state.room.current_round.puns.filter((pun_user) => {
								return pun_user.user_id === user.id;
							});
							user_has_punned = result.length > 0;
							result = this.state.room.current_round.votes.filter((vote) => {
								return vote.user_id == user.id;
							});
							user_has_voted = result.length > 0;
						}
						
						let number_of_votes = 0;
						if(this.state.room.current_round !== undefined && this.state.room.current_round.all_votes_submitted) {
							let results = this.state.room.current_round.votes.filter((vote) => {
								return vote.voted_user_id == user.id;
							});
							number_of_votes = results.length;
						}
						let is_admin = this.state.room.admin_id == user.id;
						return (
							<div key={user.id} className={"user-box " + (is_admin ? "admin" : "")}>
								<h4>{user.name}</h4>
								<img src={user.image_path} />
								{user_has_punned && (<h3>Punned</h3>)}
								{user_has_voted && (<h3>Voted</h3>)}
								{!is_admin && this.state.room.current_round !== undefined && this.state.room.current_round.all_votes_submitted && (
									<h3>{number_of_votes.toString() + " votes"}</h3>
								)}
								{this.state.room.current_round !== undefined && this.state.room.current_round.winners_id.includes(user.id) && (
									<h3>winner</h3>
								)	}
							</div>
						);
					})}
				</Fragment>
			);
		} else return(<h3>Couldn't find room</h3>);
	}
}

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			connected: false,
			room_id: undefined,
			room: undefined,
		};
		this.router = React.createRef();
	}

	componentDidMount() {
		this.socket = io();
		this.socket.on("connect", () => {
			this.setState({connected: this.socket.connected});
		});

		this.socket.on("disconnect", () => {
			this.setState({connected: this.socket.connected, room_id: ""});
		});

		this.socket.on("error", (error) => {
			this.setState({connected: this.socket.connected});
			console.log(error);
		});

		
	}

	onCreateRoom() {
		if(this.socket.connected) {
			this.socket.emit("create_room", (room_id) => {
				this.router.current.history.push("/view/" + room_id);
				this.setState({room_id: room_id});
			});
		}
	}

	render() {
		if(this.socket === undefined) {
			return(<h3>Couldn't connect to server</h3>);
		}
		return (
			<Router ref={this.router}>
				<div className="app">
					<Route exact path="/" render={() =>
						<Fragment>
							<header className="App-header">
								<h1>Pun In The Oven</h1>
								<button onClick={this.onCreateRoom.bind(this)}>Create Room</button>
							</header>
						</Fragment>
					} />
					<Route path="/view/:room_id" component={(route_props) => (<RoomView {...route_props} socket={this.socket} />)} />
				</div>
			</Router>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
