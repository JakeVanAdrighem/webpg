// Takes an 'object implementing the Event interface'
function handleKeyDown(e){
	if(e.defaultPrevented){
		return;
	}
	var key = e.key.toLowerCase();
	switch(key){
		case 'w':
			moveCamera('forward');
			break;
		case 'a':
			moveCamera('left');
			break;
		case 's':
			moveCamera('back');
			break;
		case 'd':
			moveCamera('right');
			break;
		case 'ArrowDown':
			moveCameraDown();
			break;
		case 'ArrowUp':
			moveCameraUp();
			break;
		case 'ArrowLeft':
			rotateCameraLeft();
			break;
		case 'ArrowRight':
			rotateCameraRight();
			break;
	}
	e.preventDefault();
}
