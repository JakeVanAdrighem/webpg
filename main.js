 // Rendering type. Currently webgl, otherwise set to '2d'.
 var renderingType = 'webgl';
 // Canvas ID made global
 var globalCanvasID = 'canvas';
 var globalTextCanvasID = 'textcanvas';
 // Debug enabled?
 var debug = true;

// Create the canvas element we will render into and set
// the various properties.
function setupCanvas() {
	// Set these style options for the document body to
	// ensure the canvas fills the area
	document.body.style.margin = "0px";
	document.body.style.overflow = "hidden";
	// Create a container to hold the canvases
	var canvasContainer = document.createElement("div");
	canvasContainer.style.position = "relative";
 	// Create the text and rendering canvases
 	var cvs = document.createElement("canvas");
 	var tcvs = document.createElement("canvas");

	/*						*/
	/* Style settings for the various elements	*/
	/*						*/
	// Apparently some browsers show a dotted outline
	// around a canvas that has focus. I've yet to
	// encounter this myself but this is a proposed fix.
	cvs.style.outline = "none";
	tcvs.style.outline = "none";
	
	// The text canvas needs custom settings so that it will
	// overlap the webgl canvas.
	tcvs.style.position = "absolute";
	tcvs.style.left = "0px";
	tcvs.style.right = "0px";
	tcvs.style['z-index'] = 10;

	// Unique identifier
	cvs.id = globalCanvasID;
	tcvs.id = globalTextCanvasID;

 	// Fill the body of the window with the canvas
 	cvs.width = window.innerWidth;
 	cvs.height = window.innerHeight;
 	tcvs.width = window.innerWidth;
 	tcvs.height = window.innerHeight;

 	// Introduce our elements to the DOM
	document.body.append(canvasContainer);
 	canvasContainer.append(cvs);
 	canvasContainer.append(tcvs);
}

// Retrieve a reference to the canvas element that we render into
function getRenderingCanvas(){
	var cvs = null;
	cvs = document.getElementById(globalCanvasID);
	if(!cvs){
		console.log("Could not retrieve canvas with ID " + globalCanvasID);
	}
	return cvs;
}

// Retrieve a reference to the text canvas element that we draw onto
// This is currently only used for debug information.
function getTextCanvas(){
	var cvs = null;
	cvs = document.getElementById(globalTextCanvasID);
	if(!cvs){
		console.log("Could not retrieve canvas with ID " + globalTextCanvasID);
	}
	return cvs;
}

// Kick off the game loop
function startGame(){
	console.log("startGame()");
	render();
}

// Setup various page elements and the rendering systems. This function
// also calls startGame which kicks off all game logic.
window.onload = function() {
	setupCanvas();
	console.log("setupCanvas()");
	initRenderingContext();
	console.log("initRenderingContext");
	// Load data
	initShaders();
	console.log("initShaders()");
	startGame();
	// Input handling is done in 'controls.js'
	document.addEventListener('keydown', handleKeyDown, false);
}

// This function resizes the canvas and fixes up our aspect ratio
// info on resize to ensure everything matches.
// TODO: I'd like to move the viewport call out of this function
// and into the rendering code somewhere.
window.onresize = function() {
	// Match canvas to the inner window of the browser.
	var cvs = getRenderingCanvas();
	cvs.width = cvs.clientWidth;
	cvs.height = cvs.clientHeight;
	// Match the aspect ratio to the size of the available canvas buffer.
	var ctx = getRenderingContext();
	var cvsBufferWidth = ctx.drawingBufferWidth;
	var cvsBufferHeight = ctx.drawingBufferHeight;
	globalAspectRatio = cvsBufferWidth/cvsBufferHeight;
	// match the viewport to the size of the canvas buffer
	ctx.viewport(0, 0, cvsBufferWidth, cvsBufferHeight);
}
