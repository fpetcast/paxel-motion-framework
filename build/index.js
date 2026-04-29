//#region src/utils/webgl.ts
function resizeCanvasToDisplaySize(canvas) {
	const displayWidth = canvas.clientWidth;
	const displayHeight = canvas.clientHeight;
	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
	if (needResize) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}
	return needResize;
}
/**
* Matrix for ortho projection
* @param {number} left   – min X del volume di vista
* @param {number} right  – max X
* @param {number} bottom – min Y
* @param {number} top    – max Y
* @param {number} near   – near distance plane
* @param {number} far    – far distance plane
* @returns {Float32Array} matrice 4×4 (16 elementi)
*/
function createOrthoMatrix(left, right, bottom, top, near = -1, far = 1) {
	const lr = 1 / (left - right);
	const bt = 1 / (bottom - top);
	const nf = 1 / (near - far);
	return new Float32Array([
		-2 * lr,
		0,
		0,
		0,
		0,
		-2 * bt,
		0,
		0,
		0,
		0,
		2 * nf,
		0,
		(left + right) * lr,
		(top + bottom) * bt,
		(far + near) * nf,
		1
	]);
}
/**
* Convert colors to Float32Array [r, g, b, a],
* 
* @param color hex string, rgb(a) or array [r,g,b,a]
*/
function parseColorRGBA(color) {
	let r, g, b, a;
	if (typeof color === "string") {
		color = color.trim();
		const hexMatch = color.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
		if (hexMatch) {
			const hex = hexMatch[1];
			r = parseInt(hex.slice(0, 2), 16);
			g = parseInt(hex.slice(2, 4), 16);
			b = parseInt(hex.slice(4, 6), 16);
			a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
		} else {
			const numMatch = color.match(/^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*(?:,\s*([\d.]+%?)\s*)?\)$/);
			if (!numMatch) {
				console.error(`Color format not valid: "${color}"`);
				return new Float32Array([
					1,
					1,
					1,
					1
				]);
			}
			const toVal = (v) => v.endsWith("%") ? Math.round(parseFloat(v) / 100 * 255) : Math.round(parseFloat(v));
			r = toVal(numMatch[1]);
			g = toVal(numMatch[2]);
			b = toVal(numMatch[3]);
			a = numMatch[4] !== void 0 ? toVal(numMatch[4]) : 255;
		}
	} else [r, g, b, a = 255] = color;
	return new Float32Array([
		r / 255,
		g / 255,
		b / 255,
		a / 255
	]);
}
const loadShader = (gl, source, type) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const errorMsg = `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`;
		console.error(errorMsg);
		gl.deleteShader(shader);
		throw new Error(errorMsg);
	}
	return shader;
};
const createGraphicProgram = (gl, params) => {
	let vertexShader = loadShader(gl, params.vertex, gl.VERTEX_SHADER);
	let fragmentShader = loadShader(gl, params.fragment, gl.FRAGMENT_SHADER);
	const shaderProgram = gl.createProgram();
	if (vertexShader) gl.attachShader(shaderProgram, vertexShader);
	if (fragmentShader) gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		const errorMsg = `Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`;
		console.error(errorMsg);
		throw new Error(errorMsg);
	}
	return shaderProgram;
};

//#endregion
//#region src/entities/particle/index.ts
var PaxelParticle = class {
	get id() {
		return this._id;
	}
	get size() {
		return {
			x: this.width,
			y: this.height
		};
	}
	get isFreezed() {
		return this._freezed;
	}
	get visible() {
		return this._visible;
	}
	get position() {
		return this._position;
	}
	get velocity() {
		return this._velocity;
	}
	constructor(data) {
		this.color = "#ffffff";
		this._freezed = false;
		this._visible = true;
		this._velocity = {
			x: 0,
			y: 0
		};
		this._id = this.getUuid();
		this._position = data.position;
		this._originalPosition = data.position;
		this.width = data.width;
		this.height = data.height;
		if (data?.color) this.color = data.color;
	}
	setPosition(x, y) {
		this._position = {
			x,
			y
		};
	}
	getColor() {
		return this.color;
	}
	getParsedColor() {
		return parseColorRGBA(this.color);
	}
	setColor(color) {
		this.color = color;
	}
	restoreOriginalPosition() {
		this.setPosition(this._originalPosition.x, this._originalPosition.y);
		return { ...this._originalPosition };
	}
	setFreeze(freeze) {
		this._freezed = freeze;
	}
	setVisible(visible) {
		this._visible = visible;
	}
	getUuid() {
		return `${Date.now().toString(36) + Math.random().toString(36).slice(2, 7)}`;
	}
};

//#endregion
//#region src/controllers/grid-controller.ts
var GridController = class {
	get motionParticles() {
		return this.drawLayer.particles;
	}
	get gridData() {
		return {
			width: this.width,
			height: this.height
		};
	}
	get numCells() {
		return this.width * this.height;
	}
	get size() {
		return this.width * this.cellSize;
	}
	constructor(gridOptions = {
		rows: 32,
		columns: 32,
		cellSize: 20
	}) {
		this.setGridOptions(gridOptions);
	}
	setGridOptions(gridOptions) {
		this.width = gridOptions.rows;
		this.height = gridOptions.columns;
		this.cellSize = gridOptions.cellSize;
	}
	setLayer(layer) {
		this.drawLayer = layer;
	}
	getLayer() {
		return this.drawLayer;
	}
	setCellAtPosition(clientX, clinetY, color) {
		const { row, column } = this.getCellGridPosition(clientX, clinetY);
		this.setCellInGrid(row, column, color);
	}
	setCellInGrid(row, column, color) {
		if (this.getCellIndex(row, column) < 0) {
			this.addCell({
				row,
				column,
				color
			});
			return;
		}
		this.updateCell(row, column, { color });
	}
	removeCellAtPosition(clientX, clientY) {
		const { row, column } = this.getCellGridPosition(clientX, clientY);
		this.removeCell(row, column);
	}
	removeCell(row, column) {
		const cellIndex = this.getCellIndex(row, column);
		const lastIndex = this.drawLayer.particles.length - 1;
		const deleteIndex = cellIndex;
		if (deleteIndex > -1) {
			this.drawLayer.lookup.delete(this.posKey(row, column));
			if (cellIndex !== lastIndex) {
				const lastCell = this.drawLayer.particles[lastIndex];
				this.drawLayer.particles[deleteIndex] = lastCell;
				this.drawLayer.lookup.set(this.posKey(Math.floor(lastCell.position.y / this.cellSize), Math.floor(lastCell.position.x / this.cellSize)), deleteIndex);
			}
			this.drawLayer.particles.pop();
			return true;
		}
		return false;
	}
	addCell(params) {
		const x = params.column * this.cellSize;
		const y = params.row * this.cellSize;
		const particle = new PaxelParticle({
			position: {
				x,
				y
			},
			width: this.cellSize,
			height: this.cellSize,
			color: params.color
		});
		this.drawLayer.particles.push(particle);
		this.drawLayer.lookup.set(this.posKey(Math.floor(y / this.cellSize), Math.floor(x / this.cellSize)), this.drawLayer.particles.length - 1);
		return particle;
	}
	updateCell(row, col, data) {
		const cellIndex = this.getCellIndex(row, col);
		const cell = this.drawLayer.particles[cellIndex];
		if (!cell) {
			console.error("Cannot find cell at pos: row - col ", row, col);
			return;
		}
		if (cell.getColor() !== data.color) cell.setColor(data.color);
	}
	getCellIndex(row, column) {
		const positionKey = this.posKey(row, column);
		return this.drawLayer.lookup.get(positionKey) ?? -1;
	}
	getCellGridPosition(x, y) {
		const row = Math.floor(y / this.cellSize);
		const column = Math.floor(x / this.cellSize);
		return {
			row,
			column
		};
	}
	posKey(x, y) {
		return `${x},${y}`;
	}
};

//#endregion
//#region src/systems/system.abstract.ts
var SystemAbstract = class {
	constructor() {
		this.registry = /* @__PURE__ */ new Map();
	}
	apply(layer, apply = true) {
		if (apply) this.register(layer);
		else this.unregister(layer);
	}
	toggle(layer) {
		if (this.isRegistered(layer)) this.unregister(layer);
		else this.register(layer);
	}
	register(layer) {
		if (this.isRegistered(layer)) return;
		this.registry.set(layer.name, layer);
	}
	isRegistered(layer) {
		return this.registry.get(layer.name) !== void 0;
	}
	unregister(layer) {
		return this.registry.delete(layer.name);
	}
};

//#endregion
//#region src/systems/loop-system.ts
var LoopSystem = class LoopSystem extends SystemAbstract {
	init() {
		if (this.loopTimer <= 0) this.reset();
	}
	update(time) {
		this.loopTimer -= time;
	}
	checkLoop() {
		if (this.loopTimer > 0) return false;
		this.registry.forEach((layer) => {
			this.loop(layer);
		});
		this.reset();
		return true;
	}
	reset() {
		this.loopTimer = this.loopAfter;
	}
	setLoopAfter(after) {
		this.loopAfter = after;
	}
	loop(layer) {
		layer.particles.forEach((particle) => {
			particle.restoreOriginalPosition();
			particle.setFreeze(false);
			particle.setVisible(true);
		});
	}
	constructor() {
		super();
		this.loopAfter = 2e3;
		this.loopTimer = 0;
	}
	static get instance() {
		if (!LoopSystem._instance) LoopSystem._instance = new LoopSystem();
		return LoopSystem._instance;
	}
};

//#endregion
//#region src/systems/collision-system.ts
var CollisionSystem = class CollisionSystem extends SystemAbstract {
	init() {}
	update(time) {}
	getLayerCollisionOptions(layer) {
		return this.collisionLayers.get(layer);
	}
	getLayerColliders(layer) {
		return this.collisionLayers.get(layer)?.colliders || [];
	}
	setLayerCollisionOptions(layer, collisionOptions) {
		const layerCollisionOptions = this.collisionLayers.get(layer);
		if (layerCollisionOptions) this.collisionLayers.set(layer, {
			...layerCollisionOptions,
			...collisionOptions
		});
		else this.collisionLayers.set(layer, collisionOptions);
	}
	isColliding(colliderA, colliderB) {
		return colliderA.position.x < colliderB.position.x + colliderB.size.x && colliderA.position.x + colliderA.size.x > colliderB.position.x && colliderA.position.y < colliderB.position.y + colliderB.size.y && colliderA.position.y + colliderA.size.y > colliderB.position.y;
	}
	isOutOfBounds(collider, canvas) {
		const outLeft = collider.position.x < 0;
		const outRight = collider.position.x >= canvas.width;
		const outTop = collider.position.y < 0;
		const outBottom = collider.position.y >= canvas.height;
		return {
			out: outLeft || outRight || outTop || outBottom,
			outLeft,
			outBottom,
			outRight,
			outTop
		};
	}
	checkParticleCollision(layer, colliderA, colliderAPosition, colliderB) {
		const layerCollisionOptions = this.getLayerCollisionOptions(layer);
		if (this.isColliding({
			position: colliderAPosition,
			size: colliderA.size
		}, {
			position: colliderB.position,
			size: colliderB.size
		}) && layerCollisionOptions) {
			this.resolveCollisionResponse(colliderA, layerCollisionOptions);
			return true;
		}
		return false;
	}
	resolveCollisionResponse(particle, layerCollisionOptions) {
		if (layerCollisionOptions?.destroyOnCollision) this.resolveCollisionByType(particle, "destroy");
		else if (layerCollisionOptions?.loopOnCollision) this.resolveCollisionByType(particle, "loop");
		else this.resolveCollisionByType(particle, "freeze");
	}
	resolveCollisionByType(particle, collisionResponse) {
		switch (collisionResponse) {
			case "destroy":
				particle.setVisible(false);
				particle.setFreeze(true);
				break;
			case "loop":
				particle.restoreOriginalPosition();
				break;
			case "freeze":
				particle.setFreeze(true);
				break;
			default: break;
		}
	}
	checkBoundsCollision(canvas, layer, particle, position) {
		const layerCollisionOptions = this.getLayerCollisionOptions(layer);
		const { outLeft, outRight, outBottom, outTop, out } = this.isOutOfBounds({
			position,
			size: particle.size
		}, canvas);
		if (out) {
			if (layerCollisionOptions?.destroyOnCollision) {
				particle.setVisible(false);
				particle.setFreeze(true);
			} else if (layerCollisionOptions?.loopOnCollision) particle.restoreOriginalPosition();
			else if (layerCollisionOptions?.stopOnBounds) {
				const canvasMeasures = this.getCanvasMeasures(canvas);
				if (outBottom) particle.setPosition(position.x, canvasMeasures.bottom - particle.size.x);
				else if (outTop) particle.setPosition(position.x, canvasMeasures.top);
				else if (outLeft) particle.setPosition(canvasMeasures.left, position.y);
				else if (outRight) particle.setPosition(canvasMeasures.right - particle.size.x, position.y);
				particle.setFreeze(true);
			}
			return true;
		}
		return false;
	}
	getCanvasMeasures(canvas) {
		return {
			top: 0,
			left: 0,
			right: canvas.width,
			bottom: canvas.height
		};
	}
	constructor() {
		super();
		this.collisionLayers = /* @__PURE__ */ new Map();
	}
	static get instance() {
		if (!CollisionSystem._instance) CollisionSystem._instance = new CollisionSystem();
		return CollisionSystem._instance;
	}
};

//#endregion
//#region src/systems/force-system.ts
var ForceSystem = class ForceSystem extends SystemAbstract {
	init() {}
	update(time) {}
	clear() {
		this.forces = [];
	}
	addForceToLayer(layer, forceName) {
		const force = this.getForceByName(forceName);
		if (force) {
			const layerForces = this.getForcesOnLayer(layer);
			this.forcesOnLayers.set(layer, Array.from(new Set([...layerForces, force])));
		}
	}
	removeForceFromLayer(layer, forceName) {
		const layerForces = this.getForcesOnLayer(layer);
		const forceIndex = layerForces.findIndex((f) => f.name === forceName);
		if (forceIndex >= 0) {
			layerForces.splice(forceIndex, 1);
			this.forcesOnLayers.set(layer, layerForces);
		}
	}
	getForcesOnLayer(layer) {
		return this.forcesOnLayers.get(layer) || [];
	}
	getLayerForcesResult(layer) {
		const forces = this.getForcesOnLayer(layer);
		const zeroForce = {
			x: 0,
			y: 0
		};
		return forces?.reduce((result, force) => {
			result.x += force.intensity.x;
			result.y += force.intensity.y;
			return result;
		}, zeroForce) ?? zeroForce;
	}
	getForceByName(forceName) {
		const searched = this.forces.find((f) => f.name === forceName);
		if (!searched) console.warn("Cannot find force with name:", searched);
		return searched;
	}
	upsertForce(name, intensity) {
		this.forces.push({
			name,
			intensity
		});
	}
	removeForce(name) {
		const removeIndex = this.forces.findIndex((f) => f.name === name);
		if (removeIndex >= 0) {
			this.forces.splice(removeIndex, 1);
			return removeIndex;
		}
		return -1;
	}
	applyForceToParticle(forceIntensity, particle) {
		const appliedForce = this.computeForce(particle, forceIntensity);
		return {
			x: particle.position.x + appliedForce.x,
			y: particle.position.y + appliedForce.y
		};
	}
	/**
	* Convert force from grid unit to pixels
	* @param particle 
	* @param force vector representing x and y units on grid per step 
	* @returns 
	*/
	computeForce(particle, force) {
		return {
			x: particle.size.x * force.x,
			y: particle.size.y * force.y
		};
	}
	constructor() {
		super();
		this.forces = [];
		this.forcesOnLayers = /* @__PURE__ */ new Map();
	}
	static get instance() {
		if (!ForceSystem._instance) ForceSystem._instance = new ForceSystem();
		return ForceSystem._instance;
	}
};

//#endregion
//#region src/entities/layer/index.ts
var Layer = class {
	constructor(params) {
		this.particles = [];
		this.lookup = /* @__PURE__ */ new Map();
		this.visible = true;
		this._id = this.getUuid();
		this.name = params.name;
		this.visible = params.visible;
		this.particles = params.particles;
	}
	getUuid() {
		return `${Date.now().toString(36) + Math.random().toString(36).slice(2, 7)}`;
	}
};

//#endregion
//#region src/controllers/layers-controller.ts
var LayersController = class {
	constructor() {
		this.layers = [];
		this.lookup = /* @__PURE__ */ new Map();
		this.active = "";
	}
	list() {
		return this.layers.map((layer) => layer.name);
	}
	getAll() {
		return this.layers;
	}
	create(name) {
		if (this.layers.length === 0) this.setActive(name);
		const layer = new Layer({
			name,
			particles: [],
			visible: true
		});
		this.layers.push(layer);
		this.lookup.set(name, this.layers.length - 1);
		return layer;
	}
	drop(name) {
		const dropLayerIndex = this.lookup.get(name) ?? -1;
		if (dropLayerIndex >= 0) {
			this.layers.splice(dropLayerIndex, 1);
			this.updateIndexesLookup(dropLayerIndex);
			this.lookup.delete(name);
			return dropLayerIndex;
		} else {
			console.error("Cannot find layer: ", name);
			return -1;
		}
	}
	updateIndexesLookup(fromLayerIndex) {
		this.lookup.forEach((layerIndex, layerName) => {
			if (layerIndex > fromLayerIndex) this.lookup.set(layerName, --layerIndex);
		});
	}
	changeOrder(name, toIndex) {
		const fromIndex = this.layers.findIndex((layer$1) => layer$1.name === name);
		if (fromIndex === -1) return;
		if (toIndex < 0 || toIndex >= this.layers.length) return;
		if (fromIndex === toIndex) return;
		const layer = this.layers[fromIndex];
		if (fromIndex < toIndex) for (let i = fromIndex; i < toIndex; i++) this.layers[i] = this.layers[i + 1];
		else for (let i = fromIndex; i > toIndex; i--) this.layers[i] = this.layers[i - 1];
		this.layers[toIndex] = layer;
	}
	getByIndex(index) {
		return this.layers[index];
	}
	getById(_id) {
		const index = this.layers.findIndex((l) => l._id === _id);
		if (index >= 0) return this.layers[index];
	}
	getByName(name) {
		const layerIndex = this.lookup.get(name) ?? -1;
		if (layerIndex >= 0) return this.layers[layerIndex];
		else {
			console.warn("Cannot find layer: ", name);
			return;
		}
	}
	clearAll() {
		this.layers.forEach((layer) => {
			layer.lookup.clear();
			layer.particles = [];
		});
	}
	clear(name) {
		const layer = this.getByName(name);
		if (layer) {
			layer.lookup.clear();
			layer.particles = [];
		} else console.error("Cannot clear layer: ", name);
	}
	setActive(name) {
		this.active = name;
	}
	setVisible(name, visible) {
		const layer = this.getByName(name);
		if (layer) layer.visible = visible;
	}
	getActive() {
		return this.getByName(this.active);
	}
	getParticles(filterOptions) {
		return this.layers.reduce((acc, layer) => {
			const name = layer.name;
			const notVisible = !this.isVisible(layer);
			let include = true;
			let exclude = false;
			if (filterOptions?.excludeLayers) exclude = filterOptions.excludeLayers.includes(name) ? true : false;
			if (filterOptions?.includeLayers) include = filterOptions.includeLayers.includes(name) ? true : false;
			if (notVisible || !include || exclude) return acc;
			acc = [...acc, ...layer.particles.filter((particle) => particle.visible)];
			return acc;
		}, []);
	}
	isVisible(layer) {
		return layer.visible;
	}
};

//#endregion
//#region src/shaders/instanced-pixels/index.ts
function shaders() {
	return {
		fragment: `#version 300 es
      precision mediump float;

      in vec4 v_color;
      out vec4 outColor;

      void main() {
        outColor = v_color;
      }
    `.trim(),
		vertex: `#version 300 es
      layout(location=0) in vec2 a_unit;
      layout(location=1) in vec2 a_offset;
      layout(location=2) in vec4 a_color;

      uniform mat4 u_projection;
      uniform float u_size;
      out vec4 v_color;

      void main() {
        vec2 pos = a_unit * u_size + a_offset;
        gl_Position = u_projection * vec4(pos, 0.0, 1.0);
        v_color = a_color;
      }
    `.trim()
	};
}

//#endregion
//#region src/renderer/graphics-api/webgl-canvas.ts
var WebGlCanvasApi = class {
	get inited() {
		return this._inited;
	}
	constructor(canvas, options) {
		this.canvas = canvas;
		this.options = options;
		this.type = "webgl";
		this._inited = false;
		this.canExport = false;
		this.backgroundColor = "";
		this.canExport = this.options.canExport;
		this.initWebGlContext();
		const { fragment, vertex } = shaders();
		this.renderPixelProgram = createGraphicProgram(this.gl, {
			vertex,
			fragment
		});
		this.createBuffers();
		this.bindBuffers();
		this._inited = true;
	}
	draw(gridOptions, cells) {
		const gl = this.gl;
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		if (this.backgroundColor) {
			const [r, g, b, a] = parseColorRGBA(this.backgroundColor);
			gl.clearColor(r, g, b, a);
		}
		gl.clear(gl.COLOR_BUFFER_BIT);
		const posData = new Float32Array(cells.length * 2);
		const colData = new Float32Array(cells.length * 16);
		for (let i = 0; i < cells.length; i++) {
			const cell = cells[i];
			posData[i * 2] = cell.position.x;
			posData[i * 2 + 1] = cell.position.y;
			const color = cell.getParsedColor();
			colData[i * 4] = color[0];
			colData[i * 4 + 1] = color[1];
			colData[i * 4 + 2] = color[2];
			colData[i * 4 + 3] = color[3];
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
		gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colVBO);
		gl.bufferData(gl.ARRAY_BUFFER, colData, gl.DYNAMIC_DRAW);
		gl.useProgram(this.renderPixelProgram);
		const { cellSize, rows } = gridOptions;
		gl.uniform1f(this.uCellSize, cellSize);
		const gridSize = cellSize * rows;
		const orthoMatrix = this.getOrtographicMatrix(gridSize);
		this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, orthoMatrix);
		gl.bindVertexArray(this.vao);
		gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cells.length);
		gl.bindVertexArray(null);
	}
	resize() {
		resizeCanvasToDisplaySize(this.gl.canvas);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	}
	initWebGlContext() {
		this.gl = this.canvas.getContext("webgl2", {
			alpha: true,
			preserveDrawingBuffer: this.canExport
		});
		if (!this.gl) console.error("Cannot initialize webgl context");
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.resize();
	}
	getOrtographicMatrix(gridSize) {
		return createOrthoMatrix(0, gridSize, gridSize, 0);
	}
	createBuffers() {
		if (!this.renderPixelProgram) return;
		this.vao = this.gl.createVertexArray();
		this.quadVBO = this.gl.createBuffer();
		this.posVBO = this.gl.createBuffer();
		this.colVBO = this.gl.createBuffer();
		this.uCellSize = this.gl.getUniformLocation(this.renderPixelProgram, "u_size");
		this.uProjectionMatrix = this.gl.getUniformLocation(this.renderPixelProgram, "u_projection");
	}
	bindBuffers() {
		const gl = this.gl;
		gl.bindVertexArray(this.vao);
		const quadVerts = new Float32Array([
			0,
			0,
			1,
			0,
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			1
		]);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
		gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(1, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colVBO);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(2, 1);
		gl.bindVertexArray(null);
	}
};

//#endregion
//#region src/renderer/index.ts
var PaxelRenderer = class {
	get minFrameDuration() {
		return 1e3 / this.maxFPS;
	}
	get frameDuration() {
		return 1e3 / this.targetFPS;
	}
	get isRunning() {
		return this.running;
	}
	constructor(canvas, config = {
		canvas: {
			width: 640,
			height: 640
		},
		grid: {
			rows: 32,
			columns: 32
		},
		defaultLayer: "layer-1",
		init: true,
		canExport: true
	}) {
		this.canvas = canvas;
		this.config = config;
		this.inited = false;
		this.loopSystem = LoopSystem.instance;
		this.forceSystem = ForceSystem.instance;
		this.collisionSystem = CollisionSystem.instance;
		this.lastTime = 0;
		this.accumulator = 0;
		this.maxFPS = 30;
		this.targetFPS = 15;
		this.running = false;
		this.defaultDrawColor = "#000000";
		if (this.config.init) this.init();
	}
	init() {
		if (this.inited) {
			console.warn("Paxel Renderer yet inited!");
			return;
		}
		this.setCanvas();
		this.graphicsApi = new WebGlCanvasApi(this.canvas, { canExport: this.config.canExport });
		if (this.graphicsApi.inited) {
			this.layersController = new LayersController();
			const gridOptions = this.getGridOptions();
			this.gridController = new GridController(gridOptions);
			const defaultLayer = this.config.defaultLayer;
			this.addLayer(defaultLayer);
			if (this.config?.defaultColor) this.defaultDrawColor = this.config.defaultColor;
			this.inited = true;
		}
	}
	resize() {
		this.graphicsApi.resize();
		if (this.inited) this.draw();
	}
	setBackgroundColor(color) {
		this.graphicsApi.backgroundColor = color;
		this.draw();
	}
	setCanvas() {
		const canvasWidth = this.config.canvas.width;
		const canvasHeight = this.config.canvas.height;
		this.canvas.style.width = `${canvasWidth}px`;
		this.canvas.style.height = `${canvasHeight}px`;
		const dpr = window.devicePixelRatio || 1;
		const cssW = canvasWidth;
		const cssH = canvasHeight;
		this.canvas.width = cssW * dpr;
		this.canvas.height = cssH * dpr;
	}
	updateConfig(config) {
		if (config.canvas !== void 0) {
			this.config.canvas = config.canvas;
			this.setCanvas();
		}
		if (config.grid !== void 0) {
			this.config.grid = config.grid;
			const gridOptions = this.getGridOptions();
			this.gridController.setGridOptions(gridOptions);
		}
		if (config.canExport !== void 0) {
			this.config.canExport = config.canExport;
			this.graphicsApi.canExport = config.canExport;
		}
	}
	drawAt(x, y, color, targetLayer) {
		if (targetLayer) this.setActiveLayer(targetLayer);
		const drawColor = color ?? this.defaultDrawColor;
		this.gridController.setCellAtPosition(x, y, drawColor);
		this.draw();
	}
	removeAt(x, y, targetLayer) {
		if (targetLayer) this.setActiveLayer(targetLayer);
		this.gridController.removeCellAtPosition(x, y);
		this.draw();
	}
	putPixel(row, column, color, targetLayer) {
		if (targetLayer) this.setActiveLayer(targetLayer);
		const drawColor = color ?? this.defaultDrawColor;
		this.gridController.setCellInGrid(row, column, drawColor);
		this.draw();
	}
	removePixel(row, column, targetLayer) {
		if (targetLayer) this.setActiveLayer(targetLayer);
		this.gridController.removeCell(row, column);
		this.draw();
	}
	/**
	* Add force to the motion mode simulation
	* @param name force name
	* @param force vector representing x and y units on grid per step
	*/
	createForce(name, forceVector) {
		this.forceSystem.upsertForce(name, forceVector);
	}
	removeForce(name) {
		this.forceSystem.removeForce(name);
	}
	applyForce(layerName, apply = true) {
		const layer = this.layersController.getByName(layerName);
		if (!layer) {
			console.error("Cannot apply force to layer: ", layerName);
			return;
		}
		this.forceSystem.apply(layer, apply);
	}
	setForceOnLayer(layerName, forceName) {
		const layer = this.layersController.getByName(layerName);
		if (layer) this.forceSystem.addForceToLayer(layer, forceName);
	}
	removeForceFromLayer(layerName, forceName) {
		const layer = this.layersController.getByName(layerName);
		if (layer) this.forceSystem.removeForceFromLayer(layer, forceName);
	}
	/**
	* Set the time duration before simulation loops in seconds
	* 
	* @param loopTime seconds before loop
	*/
	setLoopDuration(loopTime) {
		const loopMs = loopTime * 1e3;
		this.loopSystem.setLoopAfter(loopMs);
	}
	applyLoop(layerName, apply = true) {
		const layer = this.layersController.getByName(layerName);
		if (!layer) {
			console.error("Cannot apply loop to layer: ", layerName);
			return;
		}
		this.loopSystem.apply(layer, apply);
	}
	applyCollision(layerName, apply = true) {
		const layer = this.layersController.getByName(layerName);
		if (!layer) {
			console.error("Cannot apply loop to layer: ", layerName);
			return;
		}
		this.collisionSystem.apply(layer, apply);
	}
	addLayer(name, addLayerConfig = {
		force: true,
		loop: true,
		collision: true
	}) {
		if (!name) {
			console.warn("Cannot add layer with invalid name: ", name);
			return;
		}
		if (!!this.layersController.getByName(name)) {
			console.warn("Cannot add layer with name of existing layer: ", name);
			return;
		}
		const layer = this.layersController.create(name);
		if (this.gridController.getLayer() === void 0) {
			const layer$1 = this.layersController.getByIndex(0);
			this.gridController.setLayer(layer$1);
		}
		const { force, loop, collision } = addLayerConfig;
		if (force !== void 0) this.applyForce(layer.name, force);
		if (loop !== void 0) this.applyLoop(layer.name, loop);
		if (collision !== void 0) this.applyCollision(layer.name, collision);
		return name;
	}
	removeLayerByName(name) {
		const removed = this.layersController.drop(name);
		if (removed >= 0) this.draw();
		return removed;
	}
	getActiveLayer() {
		return this.gridController.getLayer().name;
	}
	setActiveLayer(name) {
		const layer = this.layersController.getByName(name);
		if (layer) this.gridController.setLayer(layer);
	}
	setLayerVisibility(name, visible) {
		this.layersController.setVisible(name, visible);
		this.draw();
	}
	setLayerCollision(name, collisionOptions) {
		const layer = this.layersController.getByName(name);
		if (layer) this.collisionSystem.setLayerCollisionOptions(layer, collisionOptions);
	}
	getLayers() {
		return this.layersController.list();
	}
	changeLayerOrder(name, index) {
		this.layersController.changeOrder(name, index);
	}
	clearLayer(name) {
		this.layersController.clear(name);
		this.draw();
	}
	clearAllLayers() {
		this.layersController.clearAll();
		this.draw();
	}
	setFPS(fps) {
		if (fps > this.maxFPS) {
			console.warn("The max fps limit is set to", this.maxFPS);
			return;
		}
		this.targetFPS = fps;
	}
	start() {
		if (this.isRunning) return;
		this.running = true;
		this.lastTime = performance.now();
		this.loopSystem.init();
		this.loop();
	}
	reset() {
		this.loopSystem.reset();
		this.layersController.getParticles().forEach((particle) => {
			particle.restoreOriginalPosition();
			particle.setFreeze(false);
		});
		if (!this.isRunning) this.draw();
	}
	stop() {
		if (!this.isRunning) return;
		this.running = false;
		if (this.loopFrameId) {
			cancelAnimationFrame(this.loopFrameId);
			this.loopFrameId = null;
		}
	}
	loop(now) {
		if (!this.isRunning) return;
		const currentTime = now ?? performance.now();
		const deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;
		this.accumulator += Math.min(deltaTime, 200);
		if (this.accumulator >= this.frameDuration) {
			const layers = this.layersController.getAll();
			this.loopSystem.update(this.accumulator);
			for (const layer of layers) {
				if (!layer.visible) continue;
				const { particles } = layer;
				const isForceEnabled = this.forceSystem.isRegistered(layer);
				const isCollisionEnabled = this.collisionSystem.isRegistered(layer);
				for (const particle of particles) {
					if (particle.isFreezed) continue;
					let updatePos = { ...particle.position };
					if (isForceEnabled) {
						const totalLayerForce = this.forceSystem.getLayerForcesResult(layer);
						updatePos = this.forceSystem.applyForceToParticle(totalLayerForce, particle);
					}
					if (isCollisionEnabled) {
						const collisionOptions = this.collisionSystem.getLayerCollisionOptions(layer);
						if (collisionOptions?.stopOnBounds) {
							if (this.collisionSystem.checkBoundsCollision(this.canvas, layer, particle, updatePos)) {
								this.collisionSystem.resolveCollisionResponse(particle, collisionOptions);
								continue;
							}
						}
						let isParticleCollision = false;
						const collidersLayers = this.collisionSystem.getLayerColliders(layer);
						const collidersParticles = this.layersController.getParticles({ includeLayers: collidersLayers });
						for (const colliderParticle of collidersParticles) {
							if (particle.id === colliderParticle.id) continue;
							isParticleCollision = this.collisionSystem.checkParticleCollision(layer, particle, updatePos, colliderParticle);
							if (isParticleCollision) break;
						}
						if (isParticleCollision) continue;
					}
					particle.setPosition(updatePos.x, updatePos.y);
				}
			}
			this.loopSystem.checkLoop();
			this.accumulator = 0;
		}
		this.draw();
		if (this.isRunning) this.loopFrameId = requestAnimationFrame(this.loop.bind(this));
	}
	draw() {
		this.graphicsApi.draw(this.getGridOptions(), this.layersController.getParticles());
	}
	getCellSize() {
		return Math.floor(this.canvas.width / this.config.grid.rows);
	}
	getGridOptions() {
		return {
			rows: this.config.grid.rows,
			columns: this.config.grid.columns,
			cellSize: this.getCellSize()
		};
	}
};

//#endregion
export { PaxelRenderer };