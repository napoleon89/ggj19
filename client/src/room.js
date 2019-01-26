import React, { Component, Fragment } from 'react';
import Globals from './globals.js';

export default class Room extends Component {
	constructor(props) {
		super(props);
		this.state = {
			name_str: "",
			photo: "",
			photo_file: null,
		};
	}

	componentDidMount() {
		console.log(Globals);
	}

	async onNameSet(e) {
		e.preventDefault();
		// Globals.socket.emit("set_name", this.state.name_str);
		let form_data = new FormData();
		form_data.append('username', this.state.name_str);
		form_data.append('user_id', Globals.user_id);
		form_data.append('room_id', this.props.room_id);
		form_data.append('image', this.state.photo_file);
		
		const post_result = await fetch('/set_user_data', {
			method: 'POST',
			body: form_data
		});
		console.log(post_result);
	}

	onNameValueChange(e) {
		this.setState({name_str: e.target.value});
	}

	onPhotoSet(event) {
		if(event.target.files.length > 0) {
			let file = event.target.files[0];
			this.setState({photo: URL.createObjectURL(file), photo_file: file});	

		}
		
	}

	render() {
		return (
			<div>
				<h3>Welcome to room {this.props.room_id} user {Globals.user_id}</h3>
				<br />
				{(this.state.photo !== "") && (
					<img className="user-photo" src={this.state.photo} />
				)}
				<label htmlFor="take-picture">
				Take picture
				</label>
				<input type="file"  id="take-picture" accept="image/*;capture=camera" onChange={this.onPhotoSet.bind(this)} />
				<h3>Name</h3>
				<input value={this.state.name_str} onChange={this.onNameValueChange.bind(this)}  className="wide-input" type="text" />
				<button onClick={this.onNameSet.bind(this)}>Join</button>
			</div>
		)
	}
}