"use strict";

	// the main program
	function getTikTakGame () {
		var tiktak = {}; // It holds everything

		///////////////////////////////
		// For IE repair
		Math.sign = Math.sign || function(x) {
			x = +x; // convert to a number
			if (x === 0 || isNaN(x)) {
				return Number(x);
			}
			return x > 0 ? 1 : -1;
		}
		
		///////////////////////////////
		// Logging of the project
		
		tiktak.debug = true;
		// log function
		tiktak.log = function () {
			if(this.debug){
				console.log.apply(this, arguments);
			}
		};


		///////////////////////////
		// auxiliary functions

		tiktak.utils = {
			getRandomInt: function (min, max) {
				return Math.floor(Math.random() * (max - min)) + min;
			},
			
			// add a class to the DOM element
			addClassToDOMElement: function(element, clsName) {
				tiktak.log("addClassToDOMElement. element= " + element + ", clsName= " + clsName)
				
				var classes = element.className.split(" ");
				for(var i=0, len=classes.length; i<len; i++) {
					if(classes[i] === clsName) {
						return;
					}
				}
				element.className += clsName;
			},
			
			// remove a class from the DOM element
			removeClassFromDOMElement: function(element, clsName) {
				var newClassName = "";
				var classes = element.className.split(" ");
				for(var i=0, len=classes.length; i<len; i++) {
					if(classes[i] !== clsName) {
							newClassName += classes[i] + " ";
					}
				}
				element.className = newClassName;
			},
			
			// gets the number of the current line of the code
			getCodeLine: function () {
				var e = new Error();
				if (!e.stack) try {
					// IE requires the Error to actually be throw or else the Error's 'stack'
					// property is undefined.
					throw e;
				} catch (e) {
					if (!e.stack) {
						return 0; // IE < 10, likely
					}
				}
				var stack = e.stack.toString().split(/\r\n|\n/);
				// We want our caller's frame. It's index into |stack| depends on the
				// browser and browser version, so we need to search for the second frame:
				var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
				do {
					var frame = stack.shift();
				} while (!frameRE.exec(frame) && stack.length);
				return frameRE.exec(stack.shift())[1];
			},
			
			// make clone of the object
			cloneObject: function (obj) {
				if (null == obj || !(obj instanceof Object) )
					return obj;
				var copy = {};
				for (var attr in obj) {
						if (obj.hasOwnProperty(attr))
							copy[attr] = obj[attr];
				}
				return copy;
			}
		};

		
		///////////////////////
		// model of the game
		tiktak.model = {
			// Initialize game model
			
			init: function(){
				tiktak.log("Model init.");
				
				var self = this;
				
				// create properties that will not change in the game process
				
				// boardWidth - number 3..30.
				// It is the maximum size of the x component.
				this.boardWidth = 3;
				
				// boardHeight - number 3..30.
				// It is the maximum size of the y component.
				this.boardHeight = 3;
				
				// itemsToWin - number 3..5.
				// How many chars user have to draw in row to win.
				this.itemsToWin = 3;
				
				//  firstMove - number 1 or 2. Number of user makes first turn.
				this.firstMove = true;
				
				// init board with default dimensions
				this.createBoard();
				
				// create users profiles
				
				// user1Sign- "X" or "O". Second user will be assigned by other char.
				// user1AI - boolean. If it is true,
				//   computer will make moves for user #1.
				// user2AI - boolean. If it is true,
				//   computer will make moves for user #2.
				function createUsers(user1Sign, user1AI, user2AI) {
					tiktak.log("createUsers. user1Sign=" + user1Sign
						+ ", user1AI=" + user1AI + ", user2AI=" + user2AI);
						
					function createUserProfile(sign, useAI) {
						return {
							'sign': sign,
							'useAI': useAI,
							'score': 0
						};
					}
					
					var users = [];
					users.push(createUserProfile(undefined, user1AI));
					users.push(createUserProfile(undefined, user2AI));
					
					var usersControl = {
						// returns other user # than userNumber from the set 1 or 2.
						otherUser: function (userNumber) {
							return (userNumber === 1 ? 2 : 1);
						},
						// return the sign of the player with given number
						getSign: function (userNumber) {
							tiktak.log("getSign. user #" + userNumber);
							tiktak.log("users =" + JSON.stringify(users));
							return users[userNumber-1].sign;
						},
						// return the arran with the scores of both players
						getScores: function () {
							tiktak.log("users =" + JSON.stringify(users));
							return [users[0].score, users[1].score];
						},
						// return is the given user uses computer to find next move
						isUseAI: function (userNumber) {
							tiktak.log("isUseAI. user #" + userNumber);
							tiktak.log("users =" + JSON.stringify(users));
							
							return users[userNumber-1].useAI;
						},
						// set players signs.
						// It does not make sense to change sign of only one player
						setSign: function (sign1) {
							tiktak.log("setSign. sign1=" + sign1);
							
							var sign2 = self.otherSign(sign1);
							
							users[0].sign = sign1;
							users[1].sign = sign2;
							
							tiktak.log("users =" + JSON.stringify(users));
						},
						setUseAI: function (userNumber, useAI) {
							tiktak.log("setUseAI. user #" + userNumber + ", useAI=" + useAI);
							
							users[userNumber-1].useAI = useAI;
							
							tiktak.log("users =" + JSON.stringify(users));
						},
						// adds one to score of winner player
						changeWinnerScore: function (userNumber) {
							tiktak.log("changeWinnerScore. user #" + userNumber);
							
							users[userNumber-1].score++;
							
							tiktak.log("users =" + JSON.stringify(users));
						}
					};

					// Set signs of the players
					usersControl.setSign(user1Sign);
					
					tiktak.log("The end of the createUsers. users = " + JSON.stringify(users));
					
					return usersControl;
				}
				
				this.users = createUsers("X", false, true);
			},
			
			// get settings object filled with current values
			getSettings: function () {
				tiktak.log("model.getSettings");
				return {
					boardWidth: this.boardWidth,
					boardHeight: this.boardHeight,
					firstMove: this.firstMove,
					user1Sign: this.users.getSign(1),
					user1AI: this.users.isUseAI(1),
					user2AI: this.users.isUseAI(2)
				};
			},
			
			// set settings object
			setSettings: function (settings) {
				tiktak.log("model.setSettings: " + JSON.stringify(settings));
				
				if(settings !== undefined){
					var needToReinitBoard = false;
					
					if(settings.boardWidth !== undefined){
						this.boardWidth = settings.boardWidth;
						needToReinitBoard = true;
					}
					
					if(settings.boardHeight !== undefined) {
						this.boardHeight = settings.boardHeight;
						needToReinitBoard = true;
					}
					
					if(settings.firstMove !== undefined)
						this.firstMove = settings.firstMove;
					
					if(settings.user1Sign !== undefined)
						this.users.setSign(settings.user1Sign);
					
					if(settings.user1AI !== undefined)
						this.users.setUseAI(1, settings.user1AI);
					
					if(settings.user2AI !== undefined)
						this.users.setUseAI(2, settings.user2AI);
					
					if(needToReinitBoard) {
						this.itemsToWin =
							this.getItemsToWin(
								this.boardWidth,
								this.boardHeight);
					}
				}
			},
			
			// detect length of the line of marks to win.
			getItemsToWin: function (width, height) {
				var maxDimension = Math.max(width, height);
				if(maxDimension === 3)
					return 3;
				if(maxDimension < 7)
					return 4;
				
				return 5;
			},
			
			// Change first player to move
			changeFirstPlayer: function () {
				this.firstMove = this.users.otherUser( this.firstMove );
			},
			
			// Start the game. Clears board. Change, if needs players settings.
			start: function () {
				tiktak.log("Model start.");

				// clear the board
				this.createBoard();
				
				// this properties will be changed in the game process
				
				// player have to make next move in the current game
				this.currentUser = this.firstMove;
				// waits while user make a move
				this.waitForUserMove = true;
				// winner line coordinates and number of player
				this.winnerDesr = undefined;
			},
			
			// create board. Board stores the numbers of players in cells.
			// If cell was not marked, it contains undefined.
			createBoard: function (){
				this.board = new Array(this.boardHeight); // array of arrays
				for(var i=0; i<this.boardHeight; i++){
					this.board[i] = new Array(this.boardWidth);
				}
			},
			
			// Find row of length itemsToWin by horizontal, vertical or diagonal.
			// It will return the code of the user whom win.
			// If drawn game returns "D".
			// If the game continues, it returns undefined.
			checkWin: function(){
				var isThereEmptySpace = false;
				
				this.winnerDesr = undefined;
				
				function setWinnerDesr(model, sx, sy, ex, ey, winner) {
						model.winnerDesr = {
							'sx': sx,
							'sy': sy,
							'ex': ex,
							'ey': ey,
							'winner': winner
						};
				}
				
				// not optimized brute force search
				
				// stores info for vertical scan
				var prevVertUser = new Array(this.boardWidth);
				var vertLen = new Array(this.boardWidth);
				// init length array with zeros
				for(var i=0; i<this.boardWidth; ++i)
					vertLen[i] = 0;
				
				// It is the number of the items in each diagonal
				var maxSize = this.boardWidth + this.boardHeight - 1;
				// stores info for left to right up to down diagonal
				var prevUdUser = new Array(maxSize);
				var uDLen = new Array(maxSize);
				// stores info for left to right down to up diagonal
				var prevDuUser = new Array(maxSize);
				var dULen = new Array(maxSize);
				// init length arrays with zeros
				for(i=0; i<maxSize; ++i){
					uDLen[i] = 0;
					dULen[i] = 0;
				}
				
				for(var y=0; y<this.boardHeight; y++){
					var prevUser = undefined;
					var curLen = 0;
					for(var x=0; x<this.boardWidth; x++){
						var currentUser = this.board[y][x];
						
						if(currentUser === undefined){
							isThereEmptySpace = true;
						} else {
							// look up for winner in horizontal direction
							if(prevUser === currentUser){
								curLen++;
								if(curLen === this.itemsToWin) {
									setWinnerDesr(this, x-this.itemsToWin+1, y, x, y, currentUser);
									return currentUser;
								}
							} else {
								prevUser = currentUser;
								curLen = 1;
							}
							// look up for winner in vertical direction
							if(prevVertUser[x] === currentUser) {
								vertLen[x]++;
								if(vertLen[x] === this.itemsToWin) {
									setWinnerDesr(this, x, y-this.itemsToWin+1, x, y, currentUser);
									return currentUser;
								}
							} else {
								prevVertUser[x] = currentUser;
								vertLen[x] = 1;
							}
							// look up for winner in up to down diagonal directions
							var d = x - y + this.boardHeight - 1; // number of ud diagonal
							if(prevUdUser[d] === currentUser){
								uDLen[d]++;
								if(uDLen[d] === this.itemsToWin) {
									setWinnerDesr(this,
										x-this.itemsToWin+1,
										y-this.itemsToWin+1,
										x,
										y,
										currentUser);
									return currentUser;
								}
							} else {
								prevUdUser[d] = currentUser;
								uDLen[d] = 1;
							}
							// look up for winner in down to up diagonal directions
							d = x + y; // number of du diagonal
							if(prevDuUser[d] === currentUser){
								dULen[d]++;
								if(dULen[d] === this.itemsToWin) {
									setWinnerDesr(this,
										x+this.itemsToWin-1,
										y-this.itemsToWin+1,
										x,
										y,
										currentUser);
									return currentUser;
								}
							} else {
								prevDuUser[d] = currentUser;
								dULen[d] = 1;
							}
						}
					}
				}
				
				if(!isThereEmptySpace)
					return "D";
				return undefined;
			},
				
			getWinnerDescr: function () {
				return this.winnerDesr;
			},
			
			// find next move for current player.
			// return [x,y] for move,
			// or undefined, if it is impossible to move.
			findNextMove: function(){
				// joker strategy
				var count = 0;
				var x = 0;
				var y = 0;
				
				while(count < 1000){
					x = tiktak.utils.getRandomInt(0, this.boardWidth);
					y = tiktak.utils.getRandomInt(0, this.boardHeight);
					if(this.board[y][x] === undefined)
						return [x,y];
					count++;
				}
				
				for(y=0; y<this.boardHeight; y++){
					for(x=0; x<this.boardWidth; x++){
						if(this.board[y][x] === undefined){
							return [x,y];
						}
					}
				}
				
				return undefined;
			},
			
			// returns whose move is it now
			whoseMove: function () {
				return this.currentUser;
			},
			
			// current user have made a move. Store it.
			// It dose not look for a winner and chages a player. Only change the board.
			makeMove: function (x, y) {
				this.waitForUserMove = false; // we already do not wait for the user move
				this.board[y][x] = this.currentUser;
			},
			
			// Change the current player.
			changeUser: function () {
				this.currentUser = this.users.otherUser( this.currentUser );
				this.waitForUserMove = true; // we wait for user move again
			},
			
			// returns other char than sign from the set "X" and "O".
			otherSign: function (sign) {
				var res = (sign === "X" ? "O" : "X");
				tiktak.log("Other sign. " + sign + " -> " + res);
				return res;
			},
			
			// log model state to console
			logState: function(){
				tiktak.log(JSON.stringify(this));
			}
		};

		
		//////////////////////////////
		// Represent view of the game
		tiktak.view = {
			// properties
			boardWidth: 3,
			boardHeight: 3,
			// id of HMTL element to draw a game
			mainDivId: undefined,
			// main container
			mainDiv: undefined,
			// references to HTML elements to manage to
			elements: {
				// title of the game
				title: undefined,
				// main menu
				menu: undefined,
				// info about current state of the game
				turnInfo: undefined,
				// board of the game
				boardDiv: undefined,
				// <table> in the boardDiv
				board: undefined,
				// score's info
				info: undefined },
			// dialog box control, to answer some questions to user
			dialogBox: undefined,
			// do we handle user's click on the board of the game
			boardBlocked: true,
			// event subscribers (functions that will call when some event occures)
			eventSubscribers: {
				move: [], // call ({x,y}) when user made a move
				start: [], // call() when user selected a "start" command
				openSettings: [], // call() when user selected a "open settings" command
				saveSettings: [] // call() when user selected a "save settings" command
			},

			// functions
			// calls subscribers of the event
			notifySubscribers: function (eventName, data) {
				tiktak.log("view.notifySubscribers. event name= "
					+ eventName + ", data= " + data);
				var subscribersArr = this.eventSubscribers[eventName];
				for(var i=0, len=subscribersArr.length; i<len; i++){
					subscribersArr[i](data);
				}
			},
			
			// subcscribe to event
			subscribeEvent: function (eventName, callback) {
				tiktak.log("view.subscribeEvent. Event name = " + eventName);
				this.eventSubscribers[eventName].push(callback);
			},
			
			// block the board
			blockBoard: function () {
				tiktak.log("view.blockBoard");
				this.boardBlocked = true;
			},
			
			// unblock the board
			unblockBoard: function () {
				tiktak.log("view.unblockBoard");
				this.boardBlocked = false;
			},
			
			// Creates dialog box used for questioning users.
			// Return function to call dialog.
			// To show a dialog use showDialog function.
			getDialogBoxControl: function (mainDiv) {
				tiktak.log("view.getDialogBoxControl");
				
				var dialogId = "tikTakDialog";
				var dialog = $(
					"<div id='" + dialogId + "' class='modal'>" +
						"<div class='modal-content'>" +
							"<div class='modal-header'>" +
								"<span class='close'>&times;</span>" +
								"<div class='modal-title'>" +
								"</div>" +
							"</div>" +
							"<div class='modal-body'>" +
							"</div>" +
							"<div class='modal-buttons'>" +
							"</div>" +
						"</div>" +
					"</div>" );
				// place the HTML element to document
				mainDiv.append(dialog);

				function raiseDialog() {
					dialog.css("display", "block");
				}
				
				function hideDialog() {
					dialog.css("display", "none");
				}
				
				function setTitle(title) {
					var titleDiv = dialog.find("div.modal-title");
					titleDiv.html(title);
				}
				
				function setMessage(message) {
					var msgDiv = dialog.find("div.modal-body" );
					msgDiv.html(message);
				}
				
				function setButtons(options, callback) {
					// factory to create callbacks
					function callbackGetter (index, value, error) {
						return function () {
							hideDialog();
							if( callback !== undefined ){
								callback(index, value, error);
							}
						};
					}
						
					var buttonsControls = [];
					for(var i=0, len=options.length; i<len; ++i){
						var value = options[i];
						var btnControl = $("<button class='modal-button'>"
							+ value
							+"</button>");
						btnControl.on('click', callbackGetter(i, value));
						buttonsControls.push(btnControl);
					}
					
					var btnsDiv = dialog.find("div.modal-buttons" );
					btnsDiv.empty().append(buttonsControls);
					
					// set close events
					var closeHandler =
						callbackGetter(undefined, undefined, "User has closed the window");
					// close button
					var closeBtn = dialog.find(".close" );
					closeBtn.on('click', closeHandler);
					// When the user clicks anywhere outside of the modal, close it
					$( window ).on('click', function (event) {
							if (event.target == dialog[0]) {
								closeHandler();
							}
						});
				}
				
				return {

					// function to call dialog
					// message - to show in the dialog. It can be html code.
					// title - of the window
					// options - is an array of strings (0..).
					//    Every presents string to show in the button to choose.
					// callback - a function(optionIndex, optionValue).
					//    It will be called when user press the button.
					//    optionIndex, optionValue will be given to function
					//    as the item choosed by the user from the options array.
					showDialog: function (message, title, options, callback) {
						setTitle( title || "." );
						setMessage( message || "Choose any of the options below" );
						setButtons(options, callback);
						raiseDialog();
					}
				};
			},
			
			// fill the controller
			init: function (divId, boardWidth, boardHeight) {
				tiktak.log("view.init");
				this.boardWidth = boardWidth;
				this.boardHeight = boardHeight;
				//var name = divId.indexOf("#") === -1 ? "#" divId : divId;
				this.mainDivId = divId;
				// find main HTML div container
				this.mainDiv = $(divId);
				if(this.mainDiv === undefined){
					this.mainDiv = $(document.body);
				}
				
				// create HTML elements
				var elems = this.elements;
				elems.title = $('<h1>', { 'class': 'gameTitle', 'text': "Tic tak toe game" });
				elems.menu = $( "<div id='menu' class='menuGame'></div>" );
				elems.turnInfo = $( "<div id='turnInfo' class='turnInfo'></div>" );
				elems.boardDiv = $( "<div id='boardDiv' class='boardContainer'></div>" );
				elems.info = $( "<div id='scoreInfo' class='scoreInfo'></div>" );
				
				// place ne HTML elements to document
				this.mainDiv.empty().append(
					elems.title,
					elems.menu,
					elems.turnInfo,
					elems.boardDiv,
					elems.info );
				
				// create dialog box control for future usage
				this.dialogBox = this.getDialogBoxControl(this.mainDiv);
			},
			
			// set settings of the view
			setSettings: function (settings) {
				tiktak.log("view.setSettings");
				
				if( settings.boardWidth !== this.boardWidth ||
						settings.boardHeight !== this.boardHeight) {
					
					// settingst has been changed
					this.boardWidth = settings.boardWidth;
					this.boardHeight = settings.boardHeight;
					
					// redraw board
					this.drawBoard();
				}
			},
			
			// main function to fill all game elements
			drawInterface: function (){
				tiktak.log("view.drawInterface");
				this.drawMenu();
				this.drawTurnInfo("...");
				this.drawBoard();
				this.drawInfo("...");
			},
			
			// draws main menu
			drawMenu: function (){
				tiktak.log("view.drawMenu");
				var self = this;
				function appendMenuItem(menuList, itemText, eventName) {
					var controlBtn = $( "<li class='menu-item'><a href=''>" + itemText + "</a></li>" );
					controlBtn.on('click', function (event) {
						event.preventDefault();
						tiktak.log("Menu click: " + eventName);
						self.notifySubscribers(eventName, undefined);
					});
					menuList.append( controlBtn );
				}
				
				var menuList = $( "<ul></ul>" );
				appendMenuItem(menuList, "New game", "start");
				appendMenuItem(menuList, "Settings", "openSettings");
				this.elements.menu.empty().append( menuList );
			},
			
			// draws turn info
			drawTurnInfo: function (info){
				tiktak.log("view.drawTurnInfo");
				this.elements.turnInfo.html(info);
			},
			
			// draws a board
			drawBoard: function (){
				tiktak.log("view.drawBoard");
				var self = this;
				
				function cellClickHandler (event){
					tiktak.log("cellClickHandler. Event= " + JSON.stringify(event));
					
					event.preventDefault();
					
					if(self.boardBlocked === true)
						return;
					
					var x = event.target.cellIndex;
					var y = event.target.parentNode.rowIndex;
					tiktak.log("row " + y + " - column " + x);
					if(event.target.innerHTML === "&nbsp;"){
						self.notifySubscribers("move", {'x': x, 'y': y});
					}
				}
				
				var boardControl = $( "<table id='board' class='gameBoard'></table>" );
				
				for(var row=0; row<self.boardHeight; row++){
					var rowControl = $( "<tr class='bordered'></tr>" );
					
					for(var col=0; col<self.boardWidth; col++){
						var cellControl = $( "<td>&nbsp;</td>" );
						cellControl.on('click', cellClickHandler);
						
						rowControl.append(cellControl);
					}
					
					boardControl.append(rowControl);
				}
				this.elements.board = boardControl;
				
				this.elements.boardDiv.empty().append( boardControl );
				
				tiktak.log("board div: " + JSON.stringify(this.elements.boardDiv));
				tiktak.log("board table: " + JSON.stringify(this.elements.board));
			},
			
			// draws current scores and other special information
			drawInfo: function (info){
				tiktak.log("view.drawInfo: " + info);
				
				this.elements.info.html(info);
			},
			
			// draws a mark in the board cell
			putMark: function (x, y, sign) {
				tiktak.log("view.putMark x=" + x + ", y=" + y + ", sign=" + sign);
				var board = this.elements.board[0];
				var cell = board.rows[y].cells[x];
				tiktak.log("Put mark " + sign + " to (" + y + ", " + x + ")");
				cell.innerHTML = sign;
			},
			
			// Assign to cells in line in the board from (sx,sy) to (ex,ey)
			// the "winner" style.
			showWinner: function (winnerDesr) {
				tiktak.log("view.showWinner =" + JSON.stringify(winnerDesr));
				
				var sx = winnerDesr.sx;
				var sy = winnerDesr.sy;
				var ex = winnerDesr.ex;
				var ey = winnerDesr.ey;
				var board = this.elements.board[0];
				var dX = Math.sign(ex - sx);
				var dY = Math.sign(ey - sy);
				tiktak.log("dX=" + dX + "; dY=" + dY);
				for(var iy=sy, ix=sx;; iy+=dY, ix+=dX){
					tiktak.log("ix=" + ix + ", iy=" + iy);
					var cell = board.rows[iy].cells[ix];
					tiktak.utils.addClassToDOMElement(cell, "winnerCell");
					if(iy==ey && ix==ex)
						break;
				}
			},
			
			// Remove all marks and appearance.
			// Set clear all information plates
			clear: function () {
				tiktak.log("view.clear board");
				var board = this.elements.board[0];
				
				for(var iy=0; iy<this.boardHeight; iy++){
					for(var ix=0; ix<this.boardWidth; ix++){
						var cell = board.rows[iy].cells[ix];
						cell.innerHTML = "&nbsp;";
						tiktak.utils.removeClassFromDOMElement(cell, "winnerCell");
						
					}
				}
			},
			
			// show dialog window with message on the top and some buttons.
			// when user press one of the buttons, it call callback and give it
			// value of the pressed button. if appeare some error it will
			// give to callback undefined index and value,
			// and third argument with error text.
			showDialog: function (message, title, option, callback) {
				tiktak.log("view.showDialog");
				this.dialogBox.showDialog(message, title, option, callback);
			},
			
			// question user for main settings.
			// call callback function and gives it settings object
			questionUserForSettings: function (settings, callback) {
				tiktak.log("view.questionUserForSettings");
				
				if(settings === undefined)
					return undefined;
				
				var self = this;
				
				var newSettings = tiktak.utils.cloneObject(settings);
				
				var twoPlayers = !(settings.user1AI || settings.user2AI);
				var selectedSign = settings.user1Sign;
				var firstMove = settings.firstMove;
				
				self.showDialog(
					"What type of the game do you want?",
					"Game's type",
					[" One player ", " Two players "],
					function (item, value, error) {
						if(error === undefined)
							twoPlayers = (item === 1);
						
						tiktak.log("User select type of the game: itme="
							+ item + ", value=" + value + ", error=" + error);
							
						var message = "Would you like to be X or O?";
						if(twoPlayers) {
							message = "What mark are going to use the first player?";
						}
						self.showDialog(message, "X or O", [" X ", " O "],
							function (item, value, error) {
								if(error === undefined)
									selectedSign = (item === 0 ? "X" : "O");
								
								tiktak.log("User select the mark: itme="
									+ item + ", value=" + value + ", error=" + error);
									
								var message = "Would you like to make first move?";
								var options = [" Yes ", " No "];
								if(twoPlayers) {
									message = "How makes first move?";
									options = ["First player", "Second player"];
								}
								self.showDialog(message, "The first move", options,
									function (item, value, error) {
										if(error === undefined)
											firstMove = item+1;
										
										tiktak.log("User select whose make first move: itme="
											+ item + ", value=" + value + ", error=" + error);
										
										newSettings.firstMove = firstMove;
										newSettings.user1Sign = selectedSign;
										newSettings.user1AI = false; // never start with to AIs
										newSettings.user2AI = !twoPlayers;
										
										callback( newSettings );
									});
							});
					});
				
				return newSettings;
			},
			
			// draws settings form and when user presses "save" button
			// raise callback with settings
			drawSettingsForm: function (settings, callback) {
				tiktak.log("view.drawSettingsForm: " + JSON.stringify(settings));
				
				// prepare values to fill in form elements
				var useAI = (settings.user1AI || settings.user2AI);
				var xSign = settings.user1Sign === "X";
				var firstUser = settings.firstMove === 1;
				
				// get select word
				function getSelectOption(value, text, selected) {
					return "<option value='" + value + "'" +
						(selected ? " selected" : "") + ">" +
						text + "</option>";
				}
				
				// create form elements
				var formId = "tikTakDialog";
				var formDiv = $(
					"<div id='" + formId + "' class='modal'>" +
						"<div class='modal-content'>" +
							"<div class='modal-header'>" +
								"<span class='close'>&times;</span>" +
								"<div class='modal-title'>" +
									"Change settings" +
								"</div>" +
							"</div>" +
							"<form id='SettingsForm'>" +
								"<div class='modal-body'>" +
									"<div class='form-group'>" +
									"<label>Type of the game:</label>" +
									"<select name='UseAI' style='display: block;margin: auto;'>" +
										getSelectOption('N', 'Two humans', !useAI) +
										getSelectOption('C', 'Computer as 2nd player', useAI) +
									"</select>" +
								"</div>" +
								"<div class='form-group'>" +
									"<label for='BoardWidth'>Board width:</label>" +
									"<input type='number' name='BoardWidth' min='3' max='20' value='" + settings.boardWidth + "' required>" +
								"</div>" +
								"<div class='form-group'>" +
									"<label for='BoardHeight'>Board height:</label>" +
									"<input type='number' name='BoardHeight' min='3' max='10' value='" + settings.boardHeight + "' required>" +
								"</div>" +
								"<div class='form-group'>" +
									"<label for='Player1Sign'>Player 1 mark:</label>" +
									"<select name='Player1Sign'>" +
										getSelectOption('X', 'X', xSign) +
										getSelectOption('O', 'O', !xSign) +
									"</select>" +
								"</div>" +
								"<div class='form-group'>" +
									"<label for='FirstMove'>First move:</label>" +
									"<select name='FirstMove'>" +
										getSelectOption('1', 'Player 1', firstUser) +
										getSelectOption('2', 'Player 2', !firstUser) +
									"</select>" +
								"</div>" +
								"</div>" +
							"</form>" +
							"<div class='modal-buttons'>" +
								"<button name='SaveBtn' class='modal-button'>" +
									"Save" +
								"</button>" +
								"<button name='CancelBtn' class='modal-button'>" +
									"Cancel" +
								"</button>" +
								"<button form='SettingsForm' type='reset' name='ResetBtn' class='modal-button'>" +
									"Reset" +
								"</button>" +
							"</div>" +
						"</div>" +
					"</div>" );
					
				// place the form to document
				this.mainDiv.append(formDiv);
				
				var form = $("#SettingsForm");
				
				// close handler
				function closeForm () {
					tiktak.log("closeForm");
					formDiv.remove();
				}
				
				// submit handler
				function saveSettings(target) {
					console.log("form.SaveSettings");
					
					var form = document.forms["SettingsForm"];
					
					// save the input data only if all of the form fields are valid
					if (form.checkValidity()) {
						console.log("Callback to save settings");
						
						// fill new settings to send
						var newSettings = tiktak.utils.cloneObject(settings);
						
						newSettings.boardWidth = parseInt(form["BoardWidth"].value);
						newSettings.boardHeight = parseInt(form["BoardHeight"].value);
						newSettings.user1AI = false;
						newSettings.user2AI = (form["UseAI"].value === "C");
						newSettings.user1Sign = form["Player1Sign"].value;
						newSettings.firstMove = parseInt(form["FirstMove"].value);
						
						// delete form
						closeForm();
						
						// send new settings to app
						if( callback !== undefined ){
							callback(newSettings);
						}
					}
				}

				// neutralize the submit event
				form.submit( function( event ) {
					event.preventDefault();
					event.stopPropagation();
					event.target.reset();
					return false;
				});
				
				// set submit handler
				var btnSave = formDiv.find('button[name=SaveBtn]');
				btnSave.on('click', saveSettings);
				
				// set close handler
				var closeBtn = formDiv.find(".close" );
				var btnCancel = formDiv.find('button[name=CancelBtn]');
				
				closeBtn.on('click', closeForm);
				btnCancel.on('click', closeForm);
				
				// show the form
				formDiv.css("display", "block");
			}
		};

		
		///////////////////////////
		// Event handlers
		tiktak.control = {
			// user starts a new game
			clickStartGame: function () {
				tiktak.log("Event clickStartGame");
				tiktak.start();
			},
			
			// user just have put an mark in a cell
			clickCell: function (data){
				tiktak.log("Event clickCell x=" + data.x + ", y=" + data.y);
				
				// block the board to prevent several clicks
				tiktak.view.blockBoard();
				
				// process the move
				tiktak.makeMove(data.x, data.y);
			},

			// user select settings menu
			clickSettings: function (){
				tiktak.log("Event clickSettings");
				tiktak.openSettings();
			},

			// user send command to save settings
			saveSettings: function (settings){
				tiktak.log("Event saveSettings");
				tiktak.setSettings(settings);
			}
			
		};
		
		
		/////////////////////////////
		// Some private function
		
		// gives text message about current turn
		function getTurnInfoText() {
			var currentUser = tiktak.model.whoseMove();
			if( tiktak.model.users.isUseAI(currentUser) )
				return "Computer is thinking...";
			
			var isTwoPlayers = tiktak.model.users.isUseAI(1) && tiktak.model.users.isUseAI(2);
			if( isTwoPlayers )
				return "Player " + currentUser + " turn.";
			
			return "Your turn.";
		}
		
		function getScoresInfoText() {
			var scores = tiktak.model.users.getScores();
			var msg =  "";
			var isTwoPlayers = !(tiktak.model.users.isUseAI(1) || tiktak.model.users.isUseAI(2));
			
			if( isTwoPlayers )
				msg = "Player 1: " + scores[0] + " | Player 2: " + scores[1];
			else
				msg = "Player: " + scores[0] + " | Computer: " + scores[1];
			
			return msg;
		}
		
		function getWinnerTextDesr(winner) {
			if( winner === 1 || winner === 2 ) {
				var msg = " wins!";
				var isTwoPlayers = tiktak.model.users.isUseAI(1) && tiktak.model.users.isUseAI(2);
				
				if( isTwoPlayers )
					msg = "Player " + winner + msg;
				else
					if(winner == 1)
						msg = "You" + msg;
					else
						msg = "Computer" + msg;
				
				return msg;
			}
			
			if( winner === "D" )
				return "Nobody wins";
			
			return "";
		}
		
		
		/////////////////////////////
		// Main logic of the program
		
		// Current player has made a move.
		// Changes the model.
		// Draw it in the view.
		// Finds if there is a winner or the drawn game.
		// Else changes current player.
		tiktak.makeMove = function (x, y) {
			tiktak.log("tiktak.makeMove");
			
			if(tiktak.model.waitForUserMove !== true)
					return; // game not waits for the move.
			
			// store the move in model
			tiktak.model.makeMove(x, y);
			
			// draw a sign of the player in the view
			var sign = tiktak.model.users.getSign(tiktak.model.currentUser);
			tiktak.view.putMark(x, y, sign);
			
			// tries to find a winner
			var winner = this.model.checkWin();
			if( winner === undefined ) {
				// It continues playing
				tiktak.model.changeUser();
				// Do some tasks for continue playing
				tiktak.processCurrentPlayerMove();
			} else {
				// The end of the game.
				tiktak.theEnd(winner);
			}
		};
		
		// process next move for computer or human
		tiktak.processCurrentPlayerMove = function () {
			tiktak.log("tiktak.processCurrentPlayerMove");
			
			// change turn info
				tiktak.view.drawTurnInfo( getTurnInfoText() );
			
			var currentUser = tiktak.model.whoseMove();
			if( tiktak.model.users.isUseAI(currentUser) ) {
				// It is a computer's move,
				// find move from AI
				var move = tiktak.model.findNextMove();
				if( move === undefined ) {
					// Something went wrong. We can not find the move.
					// Finish the game with draw.
					tiktak.theEnd(undefined);
				} else {
					// make move in the game
					tiktak.makeMove(move[0], move[1]);
				}
			} else {
				// It is human's move,
				// unblock board for user click
				tiktak.view.unblockBoard();
			}
		};
		
		// Draws the settings form.
		// It will save settings, when user changes them.
		tiktak.openSettings = function () {
			tiktak.log("tiktak. Open settings form.");
			
			var settings = tiktak.model.getSettings();
			
			tiktak.view.drawSettingsForm(settings, tiktak.setSettings);
		};
		
		tiktak.setSettings = function (settings) {
			tiktak.log("tiktak. Set settings: " + JSON.stringify(settings));
			
			if( settings === undefined )
				return;
			
			tiktak.model.setSettings(settings);
			tiktak.view.setSettings(settings);
			
			tiktak.start();			
		};
		
		// Shows message that the game is end
		// and who is winner or it is the drawn game.
		tiktak.theEnd = function(winner) {
			tiktak.log("theEndOfTheGame. winner: " + winner);
			
			// Blocks interface with message
			tiktak.view.blockBoard();
			
			// Change scores of the game
			if( winner === 1 || winner === 2) {
				// store new scores in model
				tiktak.model.users.changeWinnerScore(winner);
				// Draw a line to emphasize winners signs
				tiktak.view.showWinner( tiktak.model.getWinnerDescr() );
			}
			
			// Change info of the turn. the next player going to make the first move.
			tiktak.model.changeFirstPlayer();
			
			// Show info of the turn
			var headerInfo = "<h3>" + getWinnerTextDesr(winner) + "</h3>";
			tiktak.view.drawTurnInfo(headerInfo);
			
			// Redraw scores of the game
			tiktak.view.drawInfo( getScoresInfoText() );
			
			// next we wait until user press "New game" button
		};
		
		// make some work to start new game
		tiktak.start = function (){
			tiktak.log("--- start tiktak ---");
			
			var self = this;
			
			// block the board
			tiktak.view.blockBoard();
			
			// restart model
			tiktak.model.start();
			
			// clear the board
			tiktak.view.clear();
			
			// Redraw scores of the game
			tiktak.view.drawInfo( getScoresInfoText() );
			
			// start to make moves
			tiktak.processCurrentPlayerMove();
						
			tiktak.log("--- end start tiktak ---");
		};

		// Initialize the game
		tiktak.init = function (mainDivId){
			tiktak.log("--- start init tiktak ---");
			
			// Initialize the main parts of the game
			tiktak.model.init();
			
			tiktak.view.init(mainDivId, tiktak.model.boardWidth, tiktak.model.boardHeight);
			
			tiktak.view.drawInterface();
			
			// subscribe events
			tiktak.view.subscribeEvent("start",	tiktak.control.clickStartGame);
				
			tiktak.view.subscribeEvent("openSettings", tiktak.control.clickSettings);
			
			tiktak.view.subscribeEvent("saveSettings", tiktak.control.saveSettings);
				
			tiktak.view.subscribeEvent("move", tiktak.control.clickCell);
			
			tiktak.log("--- end init ---");
			
			// question user for settings
			var settings = tiktak.model.getSettings();
			tiktak.view.questionUserForSettings(
				settings,
				function (newSettings, error) {
					if(error !== undefined) {
						newSettings = settings;
					}
					
					tiktak.setSettings( newSettings );
				});
		};
		
		return tiktak;
	}

	/////////////////////////
	$( document ).ready( function () {
		var tiktak = getTikTakGame();
		tiktak.init("#ticTakGame");
	});
