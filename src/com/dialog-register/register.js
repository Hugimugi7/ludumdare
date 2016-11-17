import { h, Component } 				from 'preact/preact';
import DialogBase						from 'com/dialog-base/base';

import LabelYesNo						from 'com/label-yesno/yesno';

export default class DialogRegister extends Component {
	constructor( props ) {
		super(props);
		
		this.state = {
			mail: ""
		};
	}
	
	componentDidMount() {
		this.registerMail.focus();
	}
	
	validateMail( mail ) {
		// http://stackoverflow.com/a/9204568/5678759
		//return /\S+@\S+\.\S+/.test(mail);
		//return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(mail);
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
	}

	onChange( e ) {
		this.state.mail = e.target.value;
		this.setState(this.state);
	}

	render( props ) {
		var Error = {};//{ error:"There was a problem" };
		
		// NOTE: There's a Preact bug that the extra <span /> is working around
		return (
			<DialogBase title="Create Account" ok cancel oktext="Send Activation E-mail" {...Error}>
				<div class="-info -botline">
					Enter an e-mail address to begin creating an account.
				</div>
				<div>
					<span /><span class="-label">E-mail:</span><input ref={(input) => this.registerMail = input} id="dialog-register-mail" onchange={this.onChange.bind(this)} class="-text focusable" type="text" name="email" /><LabelYesNo value={this.validateMail(this.state.mail) ? 1 : -1} />
				</div>
				<div class="-info -topline">
					Expect an activation e-mail from <code>hello@jammer.vg</code>.
				</div>
			</DialogBase>
		);
	}
}
