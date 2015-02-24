var FPS = 30;
var WIDTH = 1024;
var HEIGHT = 768;
var LETTER_SIZE = 258;
var LETTER_SCALE = .25;
var TRUE_LETTER_SIZE = LETTER_SIZE * LETTER_SCALE;

var words = ["BUCKAROO", "CHUCK WAGON"];
var currentWordArr = [];
var finishedWordArr = [];

//all time in MS
//the draw time is the amount of time between the creation of the word
//and the time the cpu char beings to draw his weapon
var X_TIMER_DRAW_LOW = 1500;
var X_TIMER_DRAW_HIGH = 3000;
//word complete timer is the amount of time it takes the cpu char to shoot
//after he has begun to draw his weapon
var X_TIMER_WORD_COMPLETE = 3000;

//how many ms are in one frame?
var FRAME_TO_MS = 1000 / FPS;
//automatically convert, don't touch
var TIMER_DRAW_LOW = Math.ceil(X_TIMER_DRAW_LOW / FRAME_TO_MS);
var TIMER_DRAW_HIGH = Math.ceil(X_TIMER_DRAW_HIGH / FRAME_TO_MS);
var TIMER_WORD_COMPLETE = Math.ceil(X_TIMER_WORD_COMPLETE / FRAME_TO_MS);

//the current timer
var currentCharTimer;
//which phase of the draw state is the cpu char in?
//Idle, Drawing, Spent, Dead
var currentCharState;
//live or dead
var playerAlive = true;
//which round the player is on
var currentRound = 0;

// create an array of assets to load
var assetsToLoader = [
  "img/letters/yellow-letters.json",
  "img/letters/solid-letters.json"
];

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
  $(function() {
    $(window).keypress(function(e) {
        var code = e.which;
        if (((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122)) || code == 32 || code == 13) {
          handleInput(code);
        }
    });
  });

  var renderer = new PIXI.autoDetectRenderer(WIDTH, HEIGHT);

  document.body.appendChild(renderer.view);

  stage = new PIXI.Stage;

  // create a new loader
  loader = new PIXI.AssetLoader(assetsToLoader);

  // use callback
  loader.onComplete = onAssetsLoaded

  //begin load
  loader.load();

  function onAssetsLoaded(){
    console.log("all assets loaded");
    rS = new rStats( {
      values: {
          frame: { caption: 'Total frame time (ms)' },
          fps: { caption: 'Framerate (FPS)' },
          render: { caption: 'WebGL Render (ms)' }
      }
    } );
    //loading the background
    var bgTexture = PIXI.Texture.fromImage("img/desert-bg.jpg");
    bg = new PIXI.Sprite(bgTexture);
    bg.position.x = 0;
    bg.position.y = 0;

    //add the character
    var character = PIXI.Texture.fromImage("img/character_1_stand.png");
    char = new PIXI.Sprite(character);
    char.position.x = 0;
    char.position.y = 0;

    //add the text
    var introText = PIXI.Texture.fromImage("img/intro-text.png");
    text = new PIXI.Sprite(introText);
    text.position.x = 0;
    text.position.y = 0;

    //add the button
    var startButton = PIXI.Texture.fromImage("img/start-button.png");
    button = new PIXI.Sprite(startButton);
    button.position.x = 100;
    button.position.y = 500;

    // make the button interactive..
    button.interactive = true;

    button.click = function(data) {
        console.log("CLICK!");
        prepareGame();
    };
    button.tap = function(data) {
        console.log("TAP!!");
        prepareGame();
    };

    prepareStage();
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

  function createLetter(letterChar, x){
    console.log("creating letter with: " + letterChar + " @ x: " + x);
    var letter = PIXI.Sprite.fromFrame(letterChar + ".png");
    letter.width = letter.height = TRUE_LETTER_SIZE;
    letter.position.x = x;
    letter.position.y = 700;
    letter.anchor.x = 0;
    letter.anchor.y = 0;
    letter.character = letterChar;
    return letter;
  }

  function clearWord(){
    while (letters.length != 0){
      var letter = letters.pop();
      letterContainer.removeChild(letter);
    }
  }

  function handleInput(key){
    //if the CPU char hasn't started to shoot, don't type
    console.log("input: key: " + key + " - state: " + currentCharState);
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
    console.log("index: " + index + " - char: (" + char + ") == currentWordArr[index]: (" + currentWordArr[index] + ")");
    if (char == currentWordArr[index]){
      swapLetter(index);
      console.log("match! " + char);
    }
    if (currentWordArr.length == finishedWordArr.length){
      //they've matched the entire word
      console.log("clearing word");
      currentCharState = "dead";
    }
  }

  function prepareStage(){
    //used to set the main menu
    stage.addChild(bg);
    stage.addChild(char);
    stage.addChild(text);
    stage.addChild(button);
    //add the containers
    stage.addChild(letterContainer);
    stage.addChild(messageContainer);
    //draw it on the stage
    renderer.render(stage);
  }

  function prepareGame(){
    //to be used when entering the game from the main menu
    stage.removeChild(button);
    stage.removeChild(text);
    //just in case
    clearInterval(animator);
    animator = setInterval(animate, FPS);
    console.log("set animator");
    resetGame();
    startGame();
  }

  function resetGame(){
    //to get a blank slate after being init-ed
    currentRound = 0;
  }

  function startGame(){
    //to be used between rounds, or after the game is prepared
    clearWord();
    currentWordArr = [];
    finishedWordArr = [];
    letters = [];
    drawWord(words[getRandomInt(0, words.length - 1)]);
    //set up a random time for the draw timer
    currentCharTimer = getRandomInt(TIMER_DRAW_LOW, TIMER_DRAW_HIGH);
    currentCharState = "idle";
    playerAlive = true;
    currentRound++;
    showMessage("Round #" + currentRound + "\nGet Ready...");
  }

  function animate() {
    rS( 'frame' ).start();
    rS( 'FPS' ).frame();
    switch (currentCharState){
      case "idle":
        if (currentCharTimer <= 0){
          //they should draw now!
          showMessage("Draw!");
          currentCharTimer = TIMER_WORD_COMPLETE;
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
        showMessage("You're Dead!\nPress enter to try again");
        playerAlive = false;
        break;
      case "dead":
        showMessage("Nice Shot!\nPress enter for your next duel");
        break;
    }
    rS( 'render' ).start();
    renderer.render(stage);
    rS( 'render' ).end();
    rS( 'frame' ).end();
    rS().update();
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

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
