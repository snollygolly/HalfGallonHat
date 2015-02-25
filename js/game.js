var FPS = 30;
var LETTER_SIZE = 258;
var LETTER_SCALE = .25;
var TRUE_LETTER_SIZE = LETTER_SIZE * LETTER_SCALE;

var words = ["BUCKAROO", "CHUCK WAGON", "BRITCHES", "BRONCO", "BUSHWHACKER", "CAMPFIRE", "CATTLE DRIVE", "COWBOY", "DROUGHT", "FISTICUFFS", "FRONTIER", "GALLOP", "GAUCHO", "GIDDYUP", "GOLD FEVER", "HOGTIE", "HORSESHOES", "LARIAT", "LASSO", "LIVESTOCK", "LONGHORNS", "MARKSMEN", "MAVERICK", "OUTLAW", "PACKHORSE", "PEACEMAKER", "PONIES", "SADDLEBAGS", "SALOON", "SHERIFF", "STALLION", "STOCKADE", "TOMBSTONE", "UNSCRUPULOUS", "VAMOOSE", "VARMINT", "VULTURES", "WRANGLER", "YEE HAW", "YONDER"];
var currentWordArr = [];
var finishedWordArr = [];

//all time in MS
//the draw time is the amount of time between the creation of the word
//and the time the cpu char beings to draw his weapon
var X_TIMER_DRAW_LOW = 1500;
var X_TIMER_DRAW_HIGH = 3000;
//word complete timer is the amount of time it takes the cpu char to shoot
//after he has begun to draw his weapon
var X_TIME_PER_LETTER = 300;

//how many ms are in one frame?
var FRAME_TO_MS = 1000 / FPS;
//automatically convert, don't touch
var TIMER_DRAW_LOW = Math.ceil(X_TIMER_DRAW_LOW / FRAME_TO_MS);
var TIMER_DRAW_HIGH = Math.ceil(X_TIMER_DRAW_HIGH / FRAME_TO_MS);
var TIME_PER_LETTER = Math.ceil(X_TIME_PER_LETTER / FRAME_TO_MS);

//the current timer
var currentCharTimer;
//which phase of the draw state is the cpu char in?
//Idle, Drawing, Spent, Dead
var currentCharState;
//live or dead
var playerAlive = true;
//which round the player is on
var currentRound = 0;
//the players score
var currentScore = 0;

var letters = [];
var messages = [];
var letterContainer = new PIXI.DisplayObjectContainer();
var messageContainer = new PIXI.DisplayObjectContainer();
// create an empty container
letterContainer.position.x = 0;
letterContainer.position.y = 0;
messageContainer.position.x = 0;
messageContainer.position.y = 0;

//the main animator
var animator;

function init(){
  Engine.init();

  //when the engine has loaded all the sprites and is ready...
  $(Engine).on("ready", function(){
    prepareGame();
  });
  //when the user presses a key...
  $(Engine).on("keypress", function(e, code){
    handleInput(code);
  });
  //when a frame is ready to be animated
  $(Engine).on("frame", function(){
    animate();
  });
}

function createSprite(path, x, y){
  var sprite = PIXI.Sprite.fromImage(path);
  sprite.x = x;
  sprite.y = y;
  return sprite;
}

function handleInput(key){
  //if the CPU char hasn't started to shoot, don't type
  //space trapping for menu stuff
  if (currentCharState == "spent" && key == 13){
    resetGame();
    startGame();
    return;
  }
  if (currentCharState == "dead" && key == 13){
    startGame();
    return;
  }
  //enter doesn't get trapped normally
  if (key == 13){
    return;
  }
  //anything else is something we don't care about
  if (currentCharState != "drawing"){
    return;
  }
  var char = String.fromCharCode(key).toUpperCase();
  if (char == " "){
    //trap the space
    char = "-";
  }
  var index = finishedWordArr.length;
  if (char == currentWordArr[index]){
    swapLetter(index);
  }
  if (currentWordArr.length == finishedWordArr.length){
    //they've matched the entire word
    currentCharState = "dead";
  }
}

function prepareGame(){
  Engine.stage.addChild(letterContainer);
  Engine.stage.addChild(messageContainer);
  //to be used when entering the game from the main menu
  Engine.hideMenu();
  //behind the scenes, we stop it as well for safety
  Engine.startAnimation();
  resetGame();
  startGame();
}

function startGame(){
  //to be used between rounds, or after the game is prepared
  clearWord();
  currentWordArr = [];
  finishedWordArr = [];
  letters = [];
  drawWord(words[Engine.utility.getRandomInt(0, words.length - 1)]);
  //set up a random time for the draw timer
  currentCharTimer = Engine.utility.getRandomInt(TIMER_DRAW_LOW, TIMER_DRAW_HIGH);
  currentCharState = "idle";
  playerAlive = true;
  currentRound++;
  showMessage("Round #" + currentRound + "\nGet Ready...");
}

function resetGame(){
  //to get a blank slate after being init-ed
  currentRound = 0;
  currentScore = 0;
}

function drawWord(word){
  //replace spaces with underscores
  word = word.replace(/ /g, "-");
  currentWordArr = wordArr = word.split("");
  for (var i = 0; i < word.length; i++)
  {
    // create an letter using the frame name.
    var letter = createLetter(wordArr[i].toLowerCase(), (TRUE_LETTER_SIZE * i));
    letters.push(letter);
    letterContainer.addChild(letter);
  }
}

function createLetter(letterChar, x){
  var letter = PIXI.Sprite.fromFrame(letterChar + ".png");
  letter.width = letter.height = TRUE_LETTER_SIZE;
  letter.position.x = x;
  letter.position.y = 700;
  letter.anchor.x = 0;
  letter.anchor.y = 0;
  letter.character = letterChar;
  return letter;
}

function swapLetter(index){
  //this replaces unfilled letters with filled letters
  var x = letters[index].position.x;
  var letterChar = letters[index].character;
  if (letterChar == "-"){letterChar = "_";}
  letterContainer.removeChild(letters[index]);
  var letter = createLetter(letterChar.toUpperCase(), x);
  letterContainer.addChild(letter);
  letters[index] = letter;
  finishedWordArr.push(letterChar);
}

function clearWord(){
  while (letters.length != 0){
    var letter = letters.pop();
    letterContainer.removeChild(letter);
  }
}

function animate() {
  switch (currentCharState){
    case "idle":
      if (currentCharTimer <= 0){
        //they should draw now!
        showMessage("Draw!");
        currentCharTimer = ((TIME_PER_LETTER * currentWordArr.length) - ((TIME_PER_LETTER / 10) * currentRound));
        console.log("draw: T_P_L: " + TIME_PER_LETTER + "* word.length: " + currentWordArr.length + " - (" + (TIME_PER_LETTER * currentWordArr.length) + ")");
        console.log("difficulty (bigger is harder): " + ((TIME_PER_LETTER / 10) * currentRound));
        currentCharState = "drawing";
      }else{
        currentCharTimer--;
      }
      break;
    case "drawing":
      if (currentCharTimer <= 0){
        showMessage("Bang!");
        //they should shoot now
        currentCharState = "spent";
      }else{
        currentCharTimer--;
      }
      break;
    case "spent":
      //player is dead, cpu is smoking a cig
      showMessage("You're Dead! Score: " + currentScore + "\nPress enter to try again");
      playerAlive = false;
      break;
    case "dead":
      showMessage("Nice Shot!\nPress enter for your next duel");
      currentScore += currentWordArr.length + currentRound;
      break;
  }
}

function showMessage(message){
  clearMessage();
  var msg = new PIXI.Text(message, {
    font: "50px Arial",
    fill: "black"
  });
  msg.position.x = 10;
  msg.position.y = 580;
  messages.push(msg);
  messageContainer.addChild(msg);
}

function clearMessage(){
  while (messages.length != 0){
    var message = messages.pop();
    messageContainer.removeChild(message);
  }
}
