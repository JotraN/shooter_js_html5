var score = 0;
var lives = 3;

function main(){
	$("#board").css("display", "block");
	$("#play").css("display", "none");
	$("#board").attr("width", $(window).width());
	$("#board").attr("height", $(window).height());
	var game = new Game();
	(function gameloop(){
		requestAnimationFrame(gameloop);
		game.update();
		game.processEvents();
		game.draw();
	})();
	$(window).resize(function(){
		$("#board").attr("width", $(window).width());
		$("#board").attr("height", $(window).height());
	});
};

function Game(){
	var board = $("#board")[0].getContext("2d");
	var objectManager = new ObjectManager();
	this.draw = function(){
		board.clearRect(0, 0, $(window).width(), $(window).height());
		objectManager.draw();
		board.fillStyle = "black";
		board.fillText(lives, 10, 30);
		board.fillText(score, 10, 20);
	};
	this.update = function(){
		if(lives >= 1)
			objectManager.update();
		else
			gameover();
	};
	this.processEvents = function(){
		objectManager.processEvents();
	};
	var gameover = function(){
		objectManager.clear();
		$("#board").hide();	
		$("#score").html("score: " + score);
		$("#score").show();
		$("#restart").css("display", "block");
		$("#restart").click(function(){
			reset();	
		});
	};
	var reset = function(){
		$("#restart").hide();
		$("#score").hide();
		$("#board").show();	
		objectManager.clear();
		lives = 3;
		score = 0;
		objectManager.setup();
	};
};

function ObjectManager(){
	var canvas = $("#board");
	var board = canvas[0].getContext("2d");
	var grid = new Grid();
	var player = new Player($("#board"));
	var enemies = [];
	var bullets = [];
	var enemyTimer = null;
	this.draw = function(){
		for(var i = 0; i < bullets.length; i++)
			bullets[i].draw(board);
		for(var i = 0; i < enemies.length; i++)
			enemies[i].draw(board);
		player.draw(board);
	};
	this.update = function(){
		grid.clear();
		grid.addObjects(enemies);
		// Update bullets
		for(var i = 0; i < bullets.length; i++){
			var result = bullets[i].update(grid.getObjects(bullets[i]), canvas.width(), canvas.height());
			if(result == -1)
				bullets.splice(i, 1);
		}
		// Update enemies
		for(var i = 0; i < enemies.length; i++){
			if(enemies[i].update(canvas.width(), canvas.height()) == -1)
				enemies.splice(i, 1);
		}
		// Update player
		player.update();
		var enemiesNearby = grid.getObjects(player);
		for(var i = 0; i < enemiesNearby.length; i++){
			if(collision(player, enemiesNearby[i])){
				enemiesNearby[i].kill();
				lives -= 1;
				return;
			}
		}
	};
	this.processEvents = function(){
		player.processEvents(bullets);
	};
	this.setup = function(){
		// Start enemies spawn.
		enemyTimer = setInterval(function(){
			enemies.push(new Enemy());
		}, 70);
	};
	this.setup();
	this.clear = function(){
		enemies = [];
		bullets = [];
		player = new Player($("#board"));
		clearInterval(enemyTimer);
	};
};

function Player(canvas){
	this.x = canvas.width()/2;
	this.y = canvas.height()/2;
	this.speed = 5;
	this.size = 5;
	var velX = 0;
	var velY = 0;
	var colors = ["aliceblue", "azure", "floralwhite", "honeydew", "ivory", "mintcream", "seashell", "snow", "white", "whitesmoke", "ghostwhite",
					"oldlace"];
	this.draw = function(board){
		board.beginPath();
		board.arc(this.x, this.y, this.size, 0, 2*Math.PI, false);
		board.strokeStyle = "black";
		board.stroke();
	};
	this.processEvents = function(bullets){
		var self = this;
		$("#board").unbind().click(function(event){
			// Remove offset created by canvas position
			var offsetY = (event.pageY - canvas.offset().top) - self.y;
			var offsetX = (event.pageX - canvas.offset().left) - self.x;
			var angle = Math.atan2(offsetX, offsetY);
			bullets.push(new Bullet(self.x+2, self.y+2, angle));
			changeColors();
		});
		$("#board").keydown(function(event){
			if(event.which == 38 || event.which == 87)
				velY = -self.speed;
			else if(event.which == 40 || event.which == 83)
				velY = self.speed;
			else if(event.which == 37 || event.which == 65)
				velX = -self.speed;
			else if(event.which == 39 || event.which == 68)
				velX = self.speed;
		});
		$("#board").keyup(function(event){
			if(event.which == 38 || event.which == 87 || event.which == 40 || event.which == 83)
				velY = 0;
			else if(event.which == 37 || event.which == 65 || event.which == 39 || event.which == 68)
				velX = 0;
		});
	};
	this.update = function(){
		var w = canvas.width();
		var h = canvas.height();
		this.x += velX;
		this.y += velY;
		if(this.x > w || this.x < 0)
			this.x -= velX;
		if(this.y > h || this.y < 0)
			this.y -= velY;
	};
	var changeColors = function(){
		var bg = colors[Math.floor(Math.random()*(colors.length - 0))];
		var bg2 = colors[Math.floor(Math.random()*(colors.length - 0))];
		$("body").css("background", bg);
		canvas.css("background", bg2);
	};
};

function Bullet(x, y, angle){
	this.x = x;
	this.y = y;
	this.speed = 7
	this.velX = this.speed*Math.sin(angle);
	this.velY = this.speed*Math.cos(angle);
	this.size = 4;
};
Bullet.prototype.draw = function(board){
	board.strokeStyle = "blue";
	board.strokeRect(this.x, this.y, this.size, this.size);
};
Bullet.prototype.update = function(enemies, width, height){
	this.x += this.velX;
	this.y += this.velY;

	for(var i = 0; i < enemies.length; i++){
		if(collision(this, enemies[i])){
			enemies[i].kill();
			score += 100;
		}
	}

	if(this.x > width || this.x < 0 || this.y > height || this.y < 0)
		return -1;
	return 0;
};

function Enemy(){
	this.x = Math.floor(Math.random()*(1000 - 0));
	this.y = Math.floor(Math.random()*(1000 - 0));
	this.speed = 5;
	this.velX = Math.floor(Math.random()*(this.speed - -this.speed)) + -this.speed;
	this.velY = Math.floor(Math.random()*(this.speed - -this.speed)) + -this.speed;
	this.size = Math.floor(Math.random()*(25 - 10)) + 10;
	this.alive = true;
};
Enemy.prototype.draw = function(board){
	board.strokeStyle = "red";
	board.strokeRect(this.x, this.y, this.size, this.size);
};
Enemy.prototype.update = function(width, height){
	if(this.velX < 1 && this.velY < 1)
		return -1;
	this.x += this.velX;
	this.y += this.velY;
	if(this.x > width || this.x < 0 || this.y > height || this.y < 0)
		return -1;
	return 0;
};
Enemy.prototype.kill = function(){
	this.alive = false;
	this.velX = 1000;
};

function Grid(){
	var grids = [[], [], [],
				 [], [], [],
				 [], [], []];
	var board = $("#board");

	this.clear = function(){
		for(var i = 0; i < grids.length; i++)
			grids[i] = [];
	};
	this.add = function(object){
		grids[this.indexOf(object)].push(object);
	};
	this.indexOf = function(object){
		if(object.y <= board.height()/3){
			if(object.x <= board.width()/3)
				return 0;
			else if(object.x >= board.width()/3 && object.x <= board.width()/3*2)
				return 1;
			else if(object.x > board.width()/3*2)
				return 2;
		} else if(object.y > board.height()/3 && object.y <= board.height()/3*2){
			if(object.x <= board.width()/3)
				return 3;
			else if(object.x >= board.width()/3 && object.x <= board.width()/3*2)
				return 4;
			else if(object.x > board.width()/3*2)
				return 5;
		} else{
			if(object.x <= board.width()/3)
				return 6;
			else if(object.x >= board.width()/3 && object.x <= board.width()/3*2)
				return 7;
			else if(object.x > board.width()/3*2)
				return 8;
		}
	};
	this.addObjects = function(objects){
		for(var i = 0; i < objects.length; i++)
			this.add(objects[i]);
	};
	this.getObjects = function(object){
		return grids[this.indexOf(object)];
	};
};

function collision(a, b){
	return (a.x + a.size > b.x && a.x < b.x + b.size && a.y + a.size > b.y && a.y < b.y + b.size) 
};
