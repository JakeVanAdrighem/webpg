 var globalAspectRatio;
 // These indicate the index of the attributes they're named for.
 // It allows us to 'enable' the attributes so that when we pass a VBO to a draw
 // call it can properly load up the attribs.
 var vertexPositionAttribute;
 var vertexShiftAttribute;

 // TODO: This is global because I don't understand the matrix helper functions
 var mvMatrix;
 // TODO: Significance of this is unclear. Is the program something like a unique handle
 // to a rendering wrapper
 var shaderProgram;
 // TODO: Same as the above
 var perspectiveMatrix;
 // Vert values
 var vertices;
 var vertices2;
 // Total frame count
 var frameCount = 0;
 var frameTime = 0;
 // Camera position. The direction vectors are relative to the position of the camera.
 // i.e. when moving forward, apply the forward vector to the camera position to move.
 var camPos = [0.0, 0.0, -6.0]; // Position
 var camOrient = [
 	[0.0, 0.0, 1.0],  // Forward Vec
	[-1.0, 0.0, 0.0], // Left Vec
	[0.0, 1.0, 0.0]  // Up Vec
	];

function initRenderingContext(){
	// Retrieve the context
	var ctx = getRenderingContext();
	// Set the aspect ratio. This is used when computing the perspective and
	// view frustrum.
	globalAspectRatio = ctx.drawingBufferWidth/ctx.drawingBufferHeight;
	// Set color clear value.
	// Currently the color is black
	ctx.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing. This allows use of the depth function
	// so that WebGL will automatically testing clipping values
	// for us using the depthFunc callback we provide below.
	ctx.enable(ctx.DEPTH_TEST);
	// Use the builtin Less than Equal depth testing function.
	// Closer values are rendered in front of further values.
	ctx.depthFunc(ctx.LEQUAL);
	// Clear color and depth
	ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
	// Set the viewport size. This ensures the renderer
	// understands a pixelcount equal to our resolution.
	ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);
}

function initShaders(){
	var ctx = getRenderingContext();
	// Retrieve a compiled vertex and fragment shader for linking
	var vertexShader = getCompiledShader(ctx, 'shader-vs');
	var fragmentShader = getCompiledShader(ctx, 'shader-fs');

	// Create the shader program
	shaderProgram = ctx.createProgram();
	ctx.attachShader(shaderProgram, vertexShader);
	ctx.attachShader(shaderProgram, fragmentShader);
	// TODO: Understand the linking process
	ctx.linkProgram(shaderProgram);

	// Confirm successful initiation of the shader program
	if(!ctx.getProgramParameter(shaderProgram, ctx.LINK_STATUS)){
		console.log("Failed to initialize the shader program: " + ctx.getProgramInfoLog(shaderProgram));
	}

	// Tell webgl which shader program to use
	ctx.useProgram(shaderProgram);

	// Should be: attrib vec3 vertexposition
	// Enable the vertex attribute array.
	vertexPositionAttribute = ctx.getAttribLocation(shaderProgram, 'aVertexPosition');
	ctx.enableVertexAttribArray(vertexPositionAttribute);
}

var RE = function() {
	return {
		
	}
};

// Retrive the shader code from the DOM element given by 'id' and compile it.
// If type isn't provided, it is checked by the type info in the element.
// This really doesn't scale long term(even ignoring the knowledge of the DOM here).
function getCompiledShader(ctx, id, type){
	var shaderScriptElement = document.getElementById(id);
	// shader script element doesn't exist in the DOM
	if(!shaderScriptElement){
		return null;
	}

	var shaderSource = shaderScriptElement.text;
	// If tyoe isn't provided we at least know it's either vertex or fragment
	if(!type){
		if(shaderScriptElement.type == 'x-shader/x-fragment') {
			type = ctx.FRAGMENT_SHADER;
		} else if(shaderScriptElement.type == 'x-shader/x-vertex') {
			type = ctx.VERTEX_SHADER;
		} else {
			// Invalid shader type
			return null;
		}
	}
	// Create storage for the shader program
	var shader = ctx.createShader(type);
	// Add the source to the shader
	ctx.shaderSource(shader, shaderSource);
	// Attempt to compile the shader
	ctx.compileShader(shader);
	// Check for successful compile
	if(!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)){
		console.log("Failed to compile shader '" + id + "' with error: " + ctx.getShaderInfoLog(shader));
		ctx.deleteShader(shader);
		return null;
	}
	return shader;
}


function initBuffers() {
	var ctx = getRenderingContext();

	// Create the buffer for our vertex data
	// TODO: Understand sizing and reusability of this buffer.
	// i.e. should we be creating many or just few(or only one?) of these buffers.
	var squareVertsBuffer = ctx.createBuffer();
	
	// Bind the buffer to the rendering context
	// TODO: Understand this completely
	// I suspect this mechanism just indicates to the draw call which
	// buffer to use when passing data to the shaders
	ctx.bindBuffer(ctx.ARRAY_BUFFER, squareVertsBuffer);

	vertices = [
	1.0,  1.0,  0.0,
	-1.0, 1.0,  0.0,
	1.0,  -1.0, 0.0,
	-1.0, -1.0, 0.0,
	1.0,  1.0,  1.0,
	-1.0, 1.0,  1.0,
	1.0,  -1.0, 1.0,
	-1.0, -1.0, 1.0
	];

	// Load vertex data into the buffer.
	// TODO: Understand this completely
	// If I understand correctly, this is the primary method by which
	// data is to be loaded into the vertex buffer. I'm unsure though
	// what exactly the common use/best practice is for the process
	// of buffering vertex data.
	ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
	return squareVertsBuffer;
}

// Main rendering function. Accepts a DOMHighResTimeStamp( decimal );
function drawScene(){
	var startTime = window.performance.now();
	var ctx = getRenderingContext();
	// Reset the viewport so WebGL knows how to convert from clipspace to pixels.
	//ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);
	ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);

	// Clear the background color and depth info
	ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);	

	//Setup the view frustrum
	setupCamera();

	// Here we initialize the buffer
	var buf = initBuffers();

	// Interleaved accesses mean we need to set the stride to be the full size of each VBO.
	// GL_FLOAT is of size 4 (in bytes) and so each vertex coord is 12 bytes whereas the shift
	// value is 4.
	ctx.vertexAttribPointer(vertexPositionAttribute, 3, ctx.FLOAT, false, 0, 0);
	
	// TODO: What is this. We had to just copy it to get going.
	setMatrixUniforms();
	
	// Render lines by interpreting array as series of points
	ctx.drawArrays(ctx.LINE_STRIP, 0, 8);
	// TODO: Not sure if we can move this window call out of here but it violates
	// the unwritten rule that we have no knowledge of the outside in the renderer.
	// tl;dr the rendering code shouldn't know about the window or anything HTML/DOM.
	//window.requestAnimationFrame(drawScene);
	frameTime = window.performance.now() - startTime;
}

function setupCamera(){
	// Setup camera perspective
	perspectiveMatrix = makePerspective(45, globalAspectRatio, 0.1, 100.0);

	// TODO: Load the identity matrix for something???
  	mvMatrix = Matrix.I(4);

	// TODO: Matrix translation
	var camPosition = $V(camPos);
  	mvMatrix = mvMatrix.x(Matrix.Translation(camPosition).ensure4x4());
	
}

function rotateCameraLeft(){
	return;	
}

function moveCamera(dir){
	if(dir === 'back'){
		camPos[0] -= camOrient[0][0];
		camPos[1] -= camOrient[0][1];
		camPos[2] -= camOrient[0][2];
	} else if(dir === 'forward'){
		camPos[0] += camOrient[0][0];
		camPos[1] += camOrient[0][1];
		camPos[2] += camOrient[0][2];
	} else if(dir === 'left'){
		camPos[0] += camOrient[1][0];
		camPos[1] += camOrient[1][1];
		camPos[2] += camOrient[1][2];
	} else if(dir === 'right'){
		camPos[0] -= camOrient[1][0];
		camPos[1] -= camOrient[1][1];
		camPos[2] -= camOrient[1][2];
	}

}

function render(){
	resize();
	drawScene();
	if(debug) drawDebug();
	frameCount++;
	window.requestAnimationFrame(render);
}

// Manual resize function called before rendering each frame. Essentially,
// It's possible that the window could be resized without the resize event
// firing. Unconditionally calling this method guarantees we're always matching
// the canvas size.
// Mostly for a point of correctness and some 'future proofing'
// against any design decisions.
// Link: https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
function resize() {
  var ctx = getRenderingContext();
  var width = ctx.canvas.clientWidth;
  var height = ctx.canvas.clientHeight;
  if (ctx.canvas.width != width || ctx.canvas.height != height) {
     ctx.canvas.width = width;
     ctx.canvas.height = height;
  }
 }

function drawDebug() {
	var ctx = getTextCanvas().getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	ctx.textBaseline = "top";
	ctx.fillStyle = "lightgreen";
	ctx.font = '24px arial';
	ctx.fillText("Frame: " + frameCount, 10, 10, ctx.canvas.clientWidth);
	// Set the precision of frameTime because we really don't even need sub ms timings.
	ctx.fillText("Frametime: " + frameTime.toPrecision(2) + "ms", 10, 30, ctx.canvas.clientWidth);
	ctx.fillText("x: " + camPos[0] + " y: " + camPos[1] + " z: " + camPos[2], 10, 50, ctx.canvas.clientWidth);
}

// TODO: Copied Verbatim from the mozilla webgl tutorial

function setMatrixUniforms() {
  var ctx = getRenderingContext();
  var pUniform = ctx.getUniformLocation(shaderProgram, "uPMatrix");
  ctx.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = ctx.getUniformLocation(shaderProgram, "uMVMatrix");
  ctx.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

///////////////////////////////////////////////////////////////////

function getRenderingContext(){
	var ctx = null;
	ctx = getRenderingCanvas().getContext(renderingType);
	// Rendering type not supported.
	if(!ctx){
		Alert(renderingType + " not supported.");
	}
	return ctx;
}
