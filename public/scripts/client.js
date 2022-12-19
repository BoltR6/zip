/** Basic Scene Setup **/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
const renderer = new THREE.WebGLRenderer();

/** Constants **/
const BASE_BOXGEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const BASE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

/** Variables **/
// Player Object
let player = {
	position: {
		x: 1,
		y: 0,
		z: 5,
	},
	rotation: {
		x: 0,
		y: 0,
		z: 0,
	},
	velocity: {
		x: 0,
		y: 0,
		z: 0,
	},
	collisionbox: {
		radius: 0.1,
		left:   "will be assigned later",
		right:  "will be assigned later",
		top:    "will be assigned later",
		bottom: "will be assigned later",
	},
	speed: 1 / 50
}
//2D array, a 1 is a block, a 0 is empty
let board = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 1, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1]
];
//List of blocks, populated by buildMap
let blocks = [];

/** Object Functions **/
//Creates a new block at a given position
function createWall(x, y, z) {
	let cube = new THREE.Mesh(BASE_BOXGEOMETRY, BASE_MATERIAL);
	cube.position.x = x;
	cube.position.y = y;
	cube.position.z = z;
	scene.add(cube);
	return cube;
}
//Generates a map based on the map variable
function buildMap(_map) {
	//Iterates through both dimensions of the map
	for (let i = 0; i < _map.length; i++) {
		for (let j = 0; j < _map[i].length; j++) {
			//If there is a block
			if (map[i][j] === 1) {
				blocks.push(createWall(i, 0, j));
			} else {
				continue;
			}
		}
	}
}

/** Keyboard and mouse handling **/
let keys = [];
window.addEventListener('keydown', function(e) {
	keys[e.key] = true;
}, false);
window.addEventListener('keyup', function(e) {
	keys[e.key] = false;
}, false);
window.addEventListener('mousemove', function(e) {
	player.rotation.y += e.movementX / 70;
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
// Checks if any blocks are colliding with player
function checkMapCollisions(){
	blocks.forEach((block) => {
		let wall_collisionbox = {
			left: block.position.x - 0.6,
			right: block.position.x + 0.6,
			top: block.position.z - 0.6,
			bottom: block.position.z + 0.6,
		};
		if (intersectRect(wall_collisionbox, player.collisionbox)) {
			player.velocity.x = 0;
			player.velocity.z = 0;
		}
	})
}

/** Player Handling **/
// Moves main camerar to player position
function snapCameraToPlayer() {
	camera.position.x = player.position.x;
	camera.position.y = player.position.y;
	camera.position.z = player.position.z;
	camera.rotation.x = player.rotation.x;
	camera.rotation.y = player.rotation.y;
	camera.rotation.z = player.rotation.z;
}
// Updates player velocity based on movement keys
function updatePlayerVelocity(){
	player.velocity.x = 0;
	player.velocity.y = 0;
	player.velocity.z = 0;
	ifKeyDown('w', () => {
		let offset = Math.PI / 2;
		player.velocity.x += Math.cos(player.rotation.y + offset) * player.speed;
		player.velocity.z += -Math.sin(player.rotation.y + offset) * player.speed;
	});
	ifKeyDown('s', () => {
		let offset = -1 * Math.PI / 2;
		player.velocity.x += Math.cos(player.rotation.y + offset) * player.speed;
		player.velocity.z += -Math.sin(player.rotation.y + offset) * player.speed;
	});
	ifKeyDown('a', () => {
		let offset = Math.PI;
		player.velocity.x += Math.cos(player.rotation.y + offset) * player.speed;
		player.velocity.z += -Math.sin(player.rotation.y + offset) * player.speed;
	});
	ifKeyDown('d', () => {
		let offset = 0;
		player.velocity.x += Math.cos(player.rotation.y + offset) * player.speed;
		player.velocity.z += -Math.sin(player.rotation.y + offset) * player.speed;
	});
}
// Updates player hitbox
function updatePlayerHitbox(){
	player.collisionbox.left   = player.position.x + player.velocity.x - player.collisionbox.radius;
	player.collisionbox.right  = player.position.x + player.velocity.x + player.collisionbox.radius;
	player.collisionbox.top    = player.position.z + player.velocity.z - player.collisionbox.radius;
	player.collisionbox.bottom = player.position.z + player.velocity.z + player.collisionbox.radius;
}
// Updates player positions from velocity changes
function updatePlayerPosition(){
	player.position.x += player.velocity.x;
	player.position.y += player.velocity.y;
	player.position.z += player.velocity.z;
}




/** SETUP - RUN ONCE **/
function setup() {
	//Initialize viewport (-16 because otherwise overflow occurs)
	renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
	document.body.appendChild(renderer.domElement);

	// Initialize camera
	snapCameraToPlayer();

	// Build the map
	buildMap(board);
}
/** DRAW - RUN EVERY FRAME **/
function animate() {
	// Framerate
	requestAnimationFrame(animate);

	// Update player position
	updatePlayerVelocity();

	//Update player hitbox
	updatePlayerHitbox();
	
	// Check if player is colliding with all of the 
	checkMapCollisions();

	// Update position
	updatePlayerPosition();

	// Snap camera to where the player is and is facing
	snapCameraToPlayer();
	
	// Finalize and render scene
	renderer.render(scene, camera);
}
setup();
animate();