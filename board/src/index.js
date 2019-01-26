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
		this.props.socket.emit("view_room", this.props.match.params.room_id);
		this.props.socket.on("room_change", (room) => {
			this.setState({room: room});
		});
	}

	onRoundStart() {
		this.props.socket.emit("try_round_start", this.props.match.params.room_id);
	}

	render() {
		return (
			<Fragment>
				<h3>Welcome to room {this.props.match.params.room_id}</h3>
				<button onClick={this.onRoundStart.bind(this)}>Start</button>
				{this.state.room !== undefined && (
					<Fragment>
						{this.state.room.users.map((user) => {
							return (
								<div className="user-box">
									<h4>{user.name}</h4>
									<img src={user.image_path} />
								</div>
							);
						})}
					</Fragment>
				)}
			</Fragment>
		);	
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

	componentWillMount() {
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
