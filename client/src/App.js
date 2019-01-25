import React, { Component } from 'react';
import './App.css';
import * as io from 'socket.io-client';

class App extends Component {
  
  componentWillMount() {
    let socket = io();
  }

  onRoomJoin() {

  }

  render() {
    return (
      <div className="app">
        <div className="centered">
          <h3>Room Code</h3>
          <input className="wide-input" type="text" />
          <button> onClick={this.onRoomJoin.bind(this)} >Join</button>
        </div>
      </div>
    );
  }
}

export default App;
