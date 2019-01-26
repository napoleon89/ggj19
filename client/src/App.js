import React, { Component, Fragment } from 'react';
import './App.css';
import * as io from 'socket.io-client';
import {BrowserRouter as Router, Route, Link, Navigation} from 'react-router-dom';
import Room from './room.js';
import Globals from './globals.js';

class App extends Component {
  
  constructor() {
    super();
    this.router = React.createRef();
    this.state = {
      connected: false,
      room_str: "",
      error_str: "",
    };
  }

  componentWillMount() {
    Globals.socket = io();
    Globals.socket.on("connect", () => {
      this.setState({connected: Globals.socket.connected});
    });

    Globals.socket.on("disconnect", () => {
      this.setState({connected: Globals.socket.connected, room_str: ""});
      Globals.user_id = "";
    });

    Globals.socket.on("error", (error) => {
      this.setState({connected: Globals.socket.connected});
      console.log(error);
    });

    if(Globals.socket.connected) {
      if(window.localStorage.getItem("room_id") != "") {
        this.joinRoom(window.localStorage.room_id);
      }
    }
  }

  joinRoom(room_id, user_id) {
    window.localStorage.setItem("room_id", room_id);
    Globals.room_id = room_id;
    Globals.user_id = user_id;
    this.router.current.history.push("/room/" + room_id);
    // Navigation.transitionTo.push("/room/" + room_id);
  }

  onRoomJoin() {
    Globals.socket.emit("join_room", this.state.room_str, (joined, user_id) => {
      if(!joined) {
        this.setState({error_str: "room does not exist"});
      } else {
        this.joinRoom(this.state.room_str, user_id);
      }
    });
  }

  onRoomValueChange(e) {
    this.setState({room_str: e.target.value});
  }

  render() {
    return (
      <div className="app">
        <Router ref={this.router}>
          <div className="centered">
          <h3>Connected: {this.state.connected ? "yes" : "no"}</h3>
            <Route exact path="/join" render={() =>
              <Fragment>
                
                <h4>{this.state.error_str}</h4>
                <h3>Room Code</h3>
                <input value={this.state.room_str} onChange={this.onRoomValueChange.bind(this)} type="text" />
                <button  onClick={this.onRoomJoin.bind(this)}>Join</button>
            </Fragment>
            } />
            <Route path="/room/:id" component={() => <Room room_id={this.state.room_str} socket={this.state.socket} />} />
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
