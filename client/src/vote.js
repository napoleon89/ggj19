import React, { Component, Fragment } from 'react';
import Globals from './globals.js';

Array.prototype.shuffle = function() {
    var input = this;
     
    for (var i = input.length-1; i >=0; i--) {
     
        var randomIndex = Math.floor(Math.random()*(i+1)); 
        var itemAtIndex = input[randomIndex]; 
         
        input[randomIndex] = input[i]; 
        input[i] = itemAtIndex;
    }
    return input;
}

export default class Vote extends Component {
    constructor(props) {
        super(props);
        this.state = {
            voted: false,
        }
    }

    onPunClick(user_id) {
        Globals.socket.emit("vote", user_id);
        this.setState({voted: true});
    }

    render() {
        if(!this.state.voted) {
            let random_puns = Object.assign(this.props.room.current_round.puns);
            random_puns.shuffle();
            return (
                <div>
                    {random_puns.map((pun_user) => {
                        let pun = pun_user.pun;
                        return (<button key={pun_user.user_id} onClick={this.onPunClick.bind(this, pun_user.user_id)} className="btn">{pun}</button>);
                    })}
                </div>
            )
        } else {
            return (<h3>Waiting for other players to vote</h3>)
        }
        
    }
}