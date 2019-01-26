import React, { Component, Fragment } from 'react';
import Globals from './globals.js';

export default class Game extends Component {

    constructor(props) {
        super(props);
        this.state = {
            room: undefined,
            is_admin: false,
        };
    }

    componentDidMount() {
        Globals.socket.on("round_start", (room) => {
            let is_admin = false;
            if(room.admin_id == Globals.user_id) is_admin = true;
			this.setState({room: room, is_admin: is_admin});
		});
    }

    render() {
        return (
            <div>{this.state.room !== undefined && this.state.is_admin ? "Admin" : "Player"}</div>
        )
    }
};