/** Basic Scene Setup **/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
const renderer = new THREE.WebGLRenderer();

/** Constants **/
const BASIC_BOXGEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const BASIC_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const WALL_BOXGEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const WALL_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const ENEMY_BOXGEOMETRY = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const ENEMY_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

/** Variables **/
//2D array, a 2 is an enemy, 1 is a block, a 0 is empty
let board = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 1, 0, 1, 1, 1, 1],
	[1, 0, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 1, 1, 1, 0, 0, 1],
	[1, 0, 2, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 2, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1]
];
//List of blocks, populated by buildMap
let entities = [];

/** Object Functions **/
class Entity {
	constructor(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes) {
		/** Rigidbody and General **/
		this.position = _position;
		this.velocity = _velocity;
		this.rotation = _rotation;
		this.collisionbox = _collisionbox;

		/** Unique Traits **/
		this.type = "Entity";
		this.attributes = _attributes;

		/** Visual Makeup **/
		this.geometry = _geometry;
		this.material = _material;
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(this.position.x, this.position.y, this.position.z);

		/** Finalization **/
		scene.add(this.mesh);
	}

	/** Physics and General **/
	// Directly sets force
	setForce(_force) {
		this.velocity.x = _force.x;
		this.velocity.y = _force.y;
		this.velocity.z = _force.z;
	}
	// Increments force
	applyForce(_force) {
		this.velocity.x += _force.x;
		this.velocity.y += _force.y;
		this.velocity.z += _force.z;
	}
	// Cecks overlap bewteen two hitbox objects
	checkCollision(_otherhitbox) {
		return intersectRect(this.collisionbox, _otherhitbox);
	}
	applyRotation(_rotation) {
		this.rotation.x += _rotation.x;
		this.rotation.y += _rotation.y;
		this.rotation.z += _rotation.z;
	}

	/** Update **/
	// Adjust collision box 
	updateCollisionBox() {
		this.collisionbox.left = this.position.x + this.velocity.x - this.collisionbox.radius;
		this.collisionbox.right = this.position.x + this.velocity.x + this.collisionbox.radius;
		this.collisionbox.top = this.position.z + this.velocity.z - this.collisionbox.radius;
		this.collisionbox.bottom = this.position.z + this.velocity.z + this.collisionbox.radius;
	}
	// Updates and renders new position
	updatePosition() {
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		this.position.z += this.velocity.z;

		this.mesh.position.set(this.position.x, this.position.y, this.position.z);
		this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
	}
	// Extended by other entity types later
	updateClassSpecific() {}
	// Complete update object
	update() {
		/** 
			The reason why most graphical engines adjust collision boxes before rendering is because 
	 			otherwise, if a collision WERE to occur that needs to happen to prevent overlap, there
		 		is a strange 'jittering' effect. This is fixed by only rendering after adjustments are 
		 		made.
 		**/
		this.updateCollisionBox();
		this.updateClassSpecific();
		this.updatePosition();
	}
}
class Player extends Entity {
	constructor(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes) {
		// Inherit normal constructor
		super(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes);

		// Set type as player
		this.type = "Player";
		
		// Bind movement of mouse to setting rotation
		let obj = this;
		window.addEventListener('mousemove', function(e) {
			/**
				You cannot call 'this' in a JS event, otherwise it refers to <event>.this, 
	 				obj is a workaround 
	  	**/
			obj.rotation.y += e.movementX / 70;
		}, false);

		// Insert player-specific constructor code here
	}
	updateClassSpecific() {
		// Reset the player's velocity
		this.setForce( {x: 0, y: 0, z:  0});

		// Build new velocity from movement keys
		let movementForce = { x: 0, y: 0, z: 0 };
		ifKeyDown('w', () => {
			let offset = Math.PI / 2;
			movementForce.x += Math.cos(this.rotation.y + offset) * this.attributes.speed;
			movementForce.z += -Math.sin(this.rotation.y + offset) * this.attributes.speed;
		});
		ifKeyDown('s', () => {
			let offset = -1 * Math.PI / 2;
			movementForce.x += Math.cos(this.rotation.y + offset) * this.attributes.speed;
			movementForce.z += -Math.sin(this.rotation.y + offset) * this.attributes.speed;
		});
		ifKeyDown('a', () => {
			let offset = Math.PI;
			movementForce.x += Math.cos(this.rotation.y + offset) * this.attributes.speed;
			movementForce.z += -Math.sin(this.rotation.y + offset) * this.attributes.speed;
		});
		ifKeyDown('d', () => {
			let offset = 0;
			movementForce.x += Math.cos(this.rotation.y + offset) * this.attributes.speed;
			movementForce.z += -Math.sin(this.rotation.y + offset) * this.attributes.speed;
		});

		// Apply the new force vector
		this.applyForce(movementForce);

		//Update collision box because collisions are about to be checked
		this.updateCollisionBox();

		//Check if it's collidng with any walls
		entities.forEach((entity) => {
			// Check if it's colliding with the player, if so prevent it from moving forward
			if (entity.type == 'Wall' && entity.checkCollision(this.collisionbox)) {
				this.velocity.x = 0;
				this.velocity.y = 0;
				this.velocity.z = 0;
			}
		})
	}
	// Overload the update, otherwise an unessecary call of this.updateCollisionBox is made
	update(){
		this.updateClassSpecific();
		this.updatePosition();
	}
}
class Wall extends Entity {
	constructor(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes) {
		//Inherit all normal construction
		super(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes);

		//Specify type as wall
		this.type = "Wall";

		// Insert special construction here
	}
	updateClassSpecific(){
		// Insert special wall code here ( although I doubt a wall does much omegalul )
	}
}
class Enemy extends Entity {
	constructor(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes) {
		//Inherit all normal construction
		super(_position, _rotation, _velocity, _collisionbox, _geometry, _material, _scene, _attributes);

		//Specify type as wall
		this.type = "Enemy";

		// Insert special construction here
	}
	updateClassSpecific(){
		// Insert special enemy code here

		// Make it spin ( looks cool )
		this.rotation.x += 0.1;
		this.rotation.y += 0.1;
		this.rotation.z += 0.1;

		// Make it hover ( double cool )
		this.position.y = Math.cos(this.rotation.x) * 0.5 + 0.5;
	}
}

//Generates a map based on the map variable
function buildMap(_map) {
	//Iterates through both dimensions of the map
	for (let i = 0; i < _map.length; i++) {
		for (let j = 0; j < _map[i].length; j++) {
			/** Legend:
	      0: Empty
	 			1: Wall
				2: Enemy
		  **/
			switch(_map[i][j]){
				case 1:
					entities.push(new Wall({ x: i, y: 0, z: j }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { radius: 0.6 }, WALL_BOXGEOMETRY, WALL_MATERIAL, scene, {}));
					break;
				case 2:
					// Adds a new enemy
					entities.push(new Enemy({ x: i, y: 0, z: j }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { radius: 0.3 }, ENEMY_BOXGEOMETRY, ENEMY_MATERIAL, scene, {}));
					break;
			}
			
		}
	}
}

/** Synchronous Keyboard Handling **/
let keys = [];
window.addEventListener('keydown', function(e) {
	keys[e.key] = true;
}, false);
window.addEventListener('keyup', function(e) {
	keys[e.key] = false;
}, false);
function ifKeyDown(_key, _callback) {
	if (keys[_key]) {
		_callback();
	}
}

/** Collision Handling **/
// Checks if two rectangle objects are colliding
function intersectRect(r1, r2) {
	return !(r2.left > r1.right ||
		r2.right < r1.left ||
		r2.top > r1.bottom ||
		r2.bottom < r1.top);
}

/** Player Handling **/
// Moves main camerar to player position
function snapCameraToEntity(_entity) {
	camera.position.x = _entity.position.x;
	camera.position.y = _entity.position.y;
	camera.position.z = _entity.position.z;
	camera.rotation.x = _entity.rotation.x;
	camera.rotation.y = _entity.rotation.y;
	camera.rotation.z = _entity.rotation.z;
}





/** SETUP - RUN ONCE **/
function setup() {
	// Initialize viewport (-16 because otherwise overflow occurs)
	renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
	document.body.appendChild(renderer.domElement);

	// Initialize main player ( You should always push player first, since you snap the cam to the first entity )
	entities.push(new Player({ x: 1, y: 0, z: 5 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { radius: 0.1 }, BASIC_BOXGEOMETRY, BASIC_MATERIAL, scene, { speed: 1 / 50 }));

	// Initialize camera
	snapCameraToEntity(entities[0]);

	// Build the map
	buildMap(board);
}
/** DRAW - RUN EVERY FRAME **/
function animate() {
	// Framerate
	requestAnimationFrame(animate);

	// Update all entities positions
	entities.forEach((e) => { e.update() });

	// Snap camera to where the player is and is facing
	snapCameraToEntity(entities[0]);

	// Finalize and render scene
	renderer.render(scene, camera);
}
setup();
animate();