import React, { Component, Fragment } from 'react';
import Globals from './globals.js';

export default class Game extends Component {

    constructor(props) {
        super(props);
        this.admin_input = React.createRef();
        this.player_input = React.createRef();
        this.state = {
            is_admin: false,
            has_punned: false,
        };
    }

    componentDidMount() {
        Globals.socket.on("round_start", (room) => {
            let is_admin = false;
            if(room.admin_id == Globals.user_id) is_admin = true;
			this.setState({room: room, is_admin: is_admin});
        });
        
    }

    onAdminSubmit() {
        let setup = this.admin_input.current.value;
        Globals.socket.emit("set_round_setup", setup);
        console.log(setup);
    }

    onPlayerSubmit() {
        let pun = this.player_input.current.value;
        Globals.socket.emit("pun_submit", pun);
        this.setState({has_punned: true});
    }

    render() {
        if(this.props.room !== undefined) {
            if(this.state.is_admin) {
                return (
                    <div>
                        <h3>Admin</h3>
                        {(this.props.room.current_round.setup === undefined) ? (
                            <Fragment>
                                <input ref={this.admin_input} type="text" />
                                <button onClick={this.onAdminSubmit.bind(this)} className="btn">Submit</button>
                            </Fragment>
                        ) : (
                            <Fragment>
                                <h3>Waiting for players to pun</h3>
                            </Fragment>
                        )}
                    </div>
                );
            } else {
                return (
                    <div>
                        <h3>Player</h3>
                        {!this.state.has_punned && this.props.room.current_round !== undefined && this.props.room.current_round.setup !== undefined && (
                            <Fragment>
                                <input ref={this.player_input} type="text" />
                                <button onClick={this.onPlayerSubmit.bind(this)} className="btn">Submit</button>
                            </Fragment>
                        )}

                        {this.state.has_punned && (
                            <h3>Waiting on other players</h3>
                        )}
                    </div>
                );
            }
        } else {
            return (<div><h3>Waiting for round to start</h3></div>);
        }
    }
};