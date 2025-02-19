import {h, render, Component, options}	from 'preact/preact';

// @ifdef DEBUG
import {}								from 'preact-devtools/devtools';
// @endif

import Sanitize							from 'internal/sanitize/sanitize';

import Router							from 'com/router/router';
import Route							from 'com/router/route';

import Layout							from "com/page/layout";
import ViewFooter						from 'com/view/footer/footer';

import PageRoot 						from 'com/page/root/root';
import PagePage 						from 'com/page/node/page/page';
import PagePost 						from 'com/page/node/post/post';
import PageItem 						from 'com/page/node/item/item';
import PageTag 							from 'com/page/node/tag/tag';
import PageUser 						from 'com/page/node/user/user';
import PageUsers 						from 'com/page/node/users/users';
import PageEvent 						from 'com/page/node/event/event';
import PageEvents 						from 'com/page/node/events/events';
import PageError 						from 'com/page/error/error';

import DialogUnfinished					from 'com/dialog/unfinished/unfinished';
import DialogLogin						from 'com/dialog/login/login';
import DialogRegister					from 'com/dialog/register/register';
import DialogActivate					from 'com/dialog/activate/activate';
import DialogReset						from 'com/dialog/reset/reset';
import DialogPassword					from 'com/dialog/password/password';
import DialogAuth						from 'com/dialog/auth/auth';
import DialogSession					from 'com/dialog/session/session';
import DialogSavebug					from 'com/dialog/savebug/savebug';
import DialogUserConfirm				from 'com/dialog/user/user-confirm';
import DialogSubmit						from 'com/dialog/submit/submit';
import DialogTV							from 'com/dialog/tv/tv';
import DialogCreate						from 'com/dialog/create/create';
import DialogErrorUpload				from 'com/dialog/errorupload/errorupload';
import DialogErrorPublish				from 'com/dialog/errorpublish/errorpublish';

//import AlertBase						from 'com/alert-base/base';

import $Node							from 'shrub/js/node/node';
import $User							from 'shrub/js/user/user';
import $NodeLove						from 'shrub/js/node/node_love';


window.LUDUMDARE_ROOT = '/';
window.SITE_ROOT = 1;


// NOTE: Deprecated
// Add special behavior: when class attribute is an array, flatten it to a string
options.vnode = function _CustomVNode(vnode) {
	if ( vnode && vnode.attributes && Array.isArray(vnode.attributes.class) ) {
		if ( vnode.attributes.class.length ) {
			vnode.attributes.class = vnode.attributes.class.join(' ');
		}
		else {
			// NOTE: this might be slow. You can disable this, and the .length check for a potential speedup
			delete vnode.attributes.class;
		}
	}
};

class Main extends Component {
	constructor( props ) {
		super(props);
		console.log("[constructor]");
		// @ifdef DEBUG
		console.log("Running in DEBUG mode");
		// @endif

		let clean = this.cleanLocation(window.location);
		if ( window.location.origin+clean.path !== window.location.href ) {
			// @ifdef DEBUG
			console.log("Cleaned URL: "+window.location.href+" => "+window.location.origin+clean.path);
			// @endif

			this.storeHistory(window.history.state, null, clean.path);
		}

		this.state = {
			// URL walking
			'path': '',
			'slugs': clean.slugs,
			'extra': [],

			// Active Node
			'node': {
				'id': 0
			},
			'parent': null,
			'superparent': null,
			'author': null,

			// Root Node
			'root': null,

			// Featured node
			'featured': null,

			// Active User
			'user': null
		};

		window.addEventListener('hashchange', this.onHashChange.bind(this));
		window.addEventListener('navchange', this.onNavChange.bind(this));
		window.addEventListener('popstate', this.onPopState.bind(this));

		this.onLogin = this.onLogin.bind(this);
	}

	componentDidMount() {
		this.fetchUser();
		this.fetchFeatured();	// Fetches root, featured, and all games associated with you
		this.fetchNode();

//		return Promise.all([
//			this.fetchUser(),
//			this.fetchFeatured(),
//			this.fetchNode()
//		]).then(r => {
//
//		});
//		.catch(err => {
//			this.setState({'error': err});
//		});
	}

	storeHistory( input, page_title = null, page_url = null ) {
		if ( window.history && window.history.replaceState && input ) {
			history.replaceState({
				'path': input.path ? input.path : "",
				'slugs': input.slugs ? input.slugs : [],
				'extra': input.extra ? input.extra : [],
				'node': input.node ? input.node : null
			}, page_title, page_url);
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		if (window.location.href.substr(-3) == "#--") {
			history.replaceState({}, '', window.location.href.replace("#--", ""));
		}

		this.storeHistory(this.state);

		if (this.state.node != prevState.node) {
			this.handleAnchors();
		}
	}

	cleanLocation( location ) {
		// Clean the URL
		let clean = {
			"pathname": Sanitize.clean_Path(location.pathname),
			"search": Sanitize.clean_Query(location.search),
			"hash": Sanitize.clean_Hash(location.hash),
		};

		clean.path = clean.pathname + clean.search + clean.hash;

		// Parse the clean URL
		clean.slugs = Sanitize.trimSlashes(clean.pathname).split('/');

		return clean;
	}

	getDialog() {
		let props = Sanitize.parseHash(window.location.hash);

		if ( window.location.hash ) {
			if ( window.location.hash.indexOf("/") != 1 && props.path !== "--") {
				switch (props.path) {
					case 'user-login':
						props.onlogin = this.onLogin;
						return <DialogLogin {...props} />;
					case 'user-confirm':
						return <DialogUserConfirm {...props} />;
					case 'user-activate':
						return <DialogActivate {...props} />;
					case 'user-register':
						return <DialogRegister {...props} />;
					case 'user-auth':
						return <DialogAuth {...props} />;
					case 'user-reset':
						return <DialogReset {...props} />;
					case 'user-password':
						return <DialogPassword {...props} />;
					case 'expired':
						return <DialogSession {...props} />;
					case 'savebug':
						return <DialogSavebug {...props} />;
					case 'create':
						return <DialogCreate {...props} />;
					case 'submit':
						return <DialogSubmit {...props} />;
					case 'tv':
						return <DialogTV {...props} />;
					case 'error-upload':
						return <DialogErrorUpload {...props} />;
					case 'error-publish':
						return <DialogErrorPublish {...props} />;
					default:
						return <DialogUnfinished {...props} />;
				}
			}
		}
		return null;
	}

	// Called by the login dialog
	onLogin() {
		this.setState({'user': null});
//		this.fetchUser();
//		this.fetchFeatured();
	}

	// *** //

	fetchFeatured( node_id ) {
		console.log("[fetchFeatured] +");

		// Used across everything below
		let Node = null;

		return $Node.What(SITE_ROOT).then(r => {
			let newState = {};

			newState.root = r.root;
			newState.featured = r.featured;
			newState.featured.what = r.node;

			//console.log("root:", r.root);
			//console.log("featured:", r.featured);
			//console.log("node:", r.node);

			let focus = 0;
			let focusDate = 0;
			let lastPublished = 0;

			console.log("[fetchFeatured] Hack! We don't support choosing your active game yes, so use logic to detect it");
			for ( let key in r.node ) {
				let newDate = new Date(r.node[key].modified).getTime();
				if ( newDate > focusDate ) {
					focusDate = newDate;
					focus = key|0;
				}
				if ( r.node[key].published ) {
					lastPublished = key|0;
					console.log('[fetchFeatured] '+key+' is published');
				}
			}
			if ( focus ) {
				console.log('[fetchFeatured] '+focus+' was the last modified');
			}

			// If the last updated is published, focus on that
			if ( r.node[focus] && r.node[focus].published ) {
				newState.featured.focus_id = focus;
			}
			// If not, make it the last known published game
			else if ( lastPublished ) {
				newState.featured.focus_id = lastPublished;
			}
			// Otherwise, just the last one we found
			else { //if ( focus > 0 ) {
				newState.featured.focus_id = focus;
			}

			console.log('[fetchFeatured] - '+newState.featured.focus_id+' chosen as focus_id');

			this.setState(newState);
		});
	}

	fetchNode( newArgs ) {
		console.log("[fetchNode] +");

		let args = ['node', 'parent', 'superparent', 'author'];
		if ( newArgs ) {
			args = args.concat(newArgs);
		}

		// Walk to the active node
		return $Node.Walk(SITE_ROOT, this.state.slugs, args).then(r => {
			// Store the path determined by the walk
			if ( r.node_id ) {
				let NewState = {};

				NewState.path = (r.path.length ? '/' : '') +this.state.slugs.slice(0, r.path.length).join('/');
				NewState.extra = r.extra;

				NewState.node = r.node[r.node_id];
				NewState.parent = NewState.node.parent ? r.node[NewState.node.parent] : null;
				NewState.superparent = NewState.node.superparent ? r.node[NewState.node.superparent] : null;
				NewState.author = NewState.node.author ? r.node[NewState.node.author] : null;
//
//				if ( r.node[SITE_ROOT] ) {
//					NewState.root = r.node[SITE_ROOT];
//				}

				this.setState(NewState);

//				// If root was returned, then trigger a featured lookup ("|0" is string-to-integer conversion)
//				if ( r.node[SITE_ROOT] && r.node[SITE_ROOT].meta['featured'] && ((r.node[SITE_ROOT].meta['featured']|0) > 0) ) {
//					return this.fetchFeatured(r.node[SITE_ROOT].meta['featured']|0);
//				}

				console.log("[fetchNode] - Node:", r.node_id);

				return null;
			}
			throw "[fetchNode] Unable to walk tree";
		})
		.catch(err => {
			this.setState({'error': err});
		});
	}

	fetchUser() {
		console.log("[fetchUser] +");

		let User = {
			'id': 0
		};

		// Fetch Active User
		return $Node.GetMy().then(r => {
			if ( r.node ) {
				User = Object.assign({}, r.node);
				User['private'] = {};
				User['private']['meta'] = r.meta;
				User['private']['refs'] = r.refs;
			}

			// Finally, user is ready
			this.setState({'user': User});

			console.log("[fetchUser] - You are", User.id, "("+User.name+")");

			// Pre-cache my Love (nothing to do with it)
			return $NodeLove.GetMy();
		})
		.catch(err => {
			// An error here isn't actually an error. It just means we have no user
			this.setState({'user': User});
		});
	}

	// *** //

	// Hash Changes are automatically differences
	onHashChange( e ) {
		console.log("hashchange: ", e.newURL);
		let slugs = this.cleanLocation(window.location).slugs;

		if ( slugs.join() === this.state.slugs.join() ) {
			this.setState({});
		}
		else {
			this.setState({
				'slugs': slugs
			});
		}

		this.handleAnchors();
	}

	handleAnchors(evtHash) {
		if ( window.location.hash || evtHash ) {
			let hash = Sanitize.parseHash(evtHash || window.location.hash);

			if ( hash.path === "" && hash.extra.length > 0 ) {
				let heading = document.getElementById(hash.extra[0]);
				if ( heading ) {
					heading.scrollIntoView();

					let viewBar = document.getElementsByClassName("view-bar")[0];
					if ( viewBar ) {
						window.scrollBy(0, -viewBar.clientHeight);
					}
				}
			}
		}
	}

	// When we navigate by clicking forward
	onNavChange( e ) {
		console.log('navchange:', e.detail.old.href, '=>', e.detail.location.href);

		if ( e.detail.location.href !== e.detail.old.href ) {
			let slugs = this.cleanLocation(e.detail.location).slugs;

			if ( slugs.join() !== this.state.slugs.join() ) {
				history.pushState(null, null, e.detail.location.pathname + e.detail.location.search);

				this.setState({
					'slugs': slugs,
					'node': {
						'id': 0
					}
				});
				this.fetchNode();
			}
		}

		// Scroll to top
		window.scrollTo(0, 0);

		this.handleAnchors(e.detail.location.hash);
	}
	// When we navigate using back/forward buttons
	onPopState( e ) {
		console.log("popstate: ", e.state);
		// NOTE: This is sometimes called on a HashChange with a null state
		if ( e.state ) {
			this.setState(e.state);
		}

		this.handleAnchors();
	}

	getTitle( node ) {
		let Title = "";
		let TitleSuffix = window.location.host;
		if (window.location.host == "ldjam.com") {
			TitleSuffix += " | Ludum Dare game jam";
		}

		if ( node.name ) {
			Title = titleParser.parse(node.name, true);		// What is titleParser?
			if ( Title === "" ) {
				Title = TitleSuffix;
			}
			else {
				Title += " | " + TitleSuffix;
			}
		}
		else {
			Title = TitleSuffix;
		}
		return Title;
	}

	render( {}, state ) {
		let {node, parent, superparent, author, user, featured, path, extra} = state;
		let NewProps = {node, parent, superparent, author, user, featured, path, extra};

		if ( node )
			document.title = this.getTitle(node);

		return (
			<div>
				<Layout {...state}>
					<Router node={node} props={NewProps} path={extra}>
						<Route type="root" component={PageRoot} />

						<Route type="page" component={PagePage} />
						<Route type="post" component={PagePost} />

						<Route type="item">
							<Route subtype="game" component={PageItem} />
						</Route>

						<Route type="tag" component={PageTag} />

						<Route type="user" component={PageUser} />
						<Route type="users" component={PageUsers} />

						<Route type="event" component={PageEvent} />
						<Route type={["events", "group", "tags"]} component={PageEvents} />

						<Route type="error" component={PageError} />
					</Router>
					{this.getDialog()}
				</Layout>
				<ViewFooter/>
			</div>
		);
	}
}

render(<Main />, document.body);
