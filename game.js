var config = {
        type: Phaser.AUTO,
        width: 640,
        height: 480,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 200 }
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

var game = new Phaser.Game(config);
var startButton = document.getElementById('start');
startButton.onclick = start;

function preload ()
{
  this.load.setBaseURL('./');

  this.load.image('desk-lady', 'assets/desk-lady.png');
  this.load.image('desk', 'assets/desk.png', {frameWidth: 600, frameHeight: 200});
  this.load.image('sun', 'assets/sun.png', {frameWidth: 640, frameHeight: 480});

  this.load.audio('somber', ['assets/Life\ Is\ -\ Song\ 1.mp3']);
  this.load.audio('upbeat', ['assets/Life\ Is\ -\ Song\ 2.mp3']);
  this.load.audio('menu', ['assets/Life\ Is\ -\ Song\ 3.mp3']);
  this.load.audio('beep', ['assets/beep.wav']);
}

var state = 'none';
var stateLoaded = false;
var keySpace;
var keyUp;
var keyDown;
var keyEnter;

var menuMusic;
var somberMusic;
var upbeatMusic;
var beep;
var beepCount = 0;

//Menu
var sunY = 540;
var sun;
var sunlight;

var lady;
var desk;

var promptText;
var promptIndex;
var nextText;

var score = {
  love: 0,
  ambition: 0,
  creativity: 0,
  integrity: 0
};

var dialogueIndex;
var menuDialogue = [
  "Hello and welcome to the Life Institute.",
  "Have you ever had the feeling that things \
  are happening for a reason?",
  "Well that's because they are!",
  "Here at the Life Institute we determine your \
destiny all from the beginning.",
  "But don't worry, it isn't all up to us. We want \
every individual to have a say in what their life \
will be like.",
  "That's why we came up with the Life Analyzer.",
  "Just answer a few simple questions.", 
  "The Life Analyzer will sprinkle in a little randomness \
  and determine your destiny!",
  "Pretty neat, right?",
  "Are you ready to give it a try?"
];

var questions = [
  {
    question: "Do you prefer to cook or go out to eat?",
    answers: ['Cook', 'Go out'],
    categories: ['creativity', 'ambition'],
    scores: [0.3, 0.1]
  },
  {
    question: "You find a wallet on the street with $100 in it. Do you...",
    answers: ['Leave it', 'Try to return it', 'Take the money'],
    categories: ['ambition', 'integrity', 'integrity'],
    scores: [-0.1, 0.3, -0.1]
  },
  {
    question: "Which would you prefer to do on a weekend?",
    answers: ["A romantic date", "Go to a big party", "Stay in and read a book", "Volunteer in your community"],
    categories: ["love", "ambition", "creativity", "integrity"],
    scores: [0.3, 0.3, 0.3, 0.3]
  },
  {
    question: "Do you believe in love at first sight?",
    answers: ["Yes", "No"],
    categories: ["love", "ambition"],
    scores: [0.3, 0.3]
  },
  {
    question: "You have a test in a week. Do you...",
    answers: ["Study alone each night", "Organize a group study session", "Worry about it later"],
    categories: ["ambition", "creativity", "ambition"],
    scores: [0.3, 0.3, -0.1]
  },
  {
    question: "You accidentally break an item in a small store. Do you...",
    answers: ["Try to hide it", "Let someone know", "Blame someone else", "Do nothing"],
    categories: ["creativity", "integrity", "integrity", "ambition"],
    scores: [0.1, 0.3, -0.1, 0.1]
  }
];

var answers = [];

var married = false;
var job = "None";
var kids = false;
var fired = false;
var divorced = false;
var positivity = 0.0;

var questionIndex;
var curQuestion;
var answer_text;
var selection = 0;
var pressed = false;

var lifeDialogue;
var textScale;
var textOpacity;

function create ()
{
  sunlight = this.add.pointlight(320, sunY, 0, 210, 5);
  sunlight.color.setTo(252, 186, 3);
  lady = this.add.image(320, 320, 'desk-lady');
  desk = this.add.image(320, 380, 'desk');
  
  menuMusic = this.sound.add('menu', {loop: true, volume: 0.5});
  somberMusic = this.sound.add('somber', {loop: false, volume: 0.7});
  upbeatMusic = this.sound.add('upbeat', {loop: false, volume: 0.7});
  beep = this.sound.add('beep', {loop: false, volume: 0.05});

  promptText = this.add.text(320, 75, '', {font: '88px Helvetica', fill: "#ffffff", align: "center", wordWrap: { width: 440*4, useAdvancedWrap: true }}).setOrigin(0.5).setScale(0.25);
  nextText = this.add.text(320, 10, '', {font: '14px Helvetica', fill: '#ffffff', align: "center"}).setOrigin(0.5);

  answer_text = [
    this.add.text(120, 150, '', {font: '18px Helvetica', fill: '#ffffff'}),
    this.add.text(120, 175, '', {font: '18px Helvetica', fill: '#ffffff'}),
    this.add.text(120, 200, '', {font: '18px Helvetica', fill: '#ffffff'}),
    this.add.text(120, 225, '', {font: '18px Helvetica', fill: '#ffffff'})
  ];

  keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
  keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
}

function update()
{
  if (state == 'menu') {
    if (!stateLoaded) {
      loadMenuState();
      stateLoaded = true;
    } else {
      menuState();
    }
  } else if (state == 'end-menu') {
    endMenuState();
  } else if (state == 'question') {
    if (!stateLoaded) {
      loadQuestionState();
      stateLoaded = true;
    } else {
      questionState();
    }
  } else if (state == 'life') {
    if (!stateLoaded) {
      loadLifeState();
      stateLoaded = true;
    } else {
      lifeState();
    }
  }
}

function start() {
  state = 'menu';
  stateLoaded = false;
  startButton.style.width = '0px';
  startButton.style.height = '0px';
  startButton.style.opacity = 0;
  startButton.onclick = null;

  lifeDialogue = [];
  score = {
    love: 0,
    ambition: 0,
    creativity: 0,
    integrity: 0
  };
  answers = [];
}

function loadMenuState() {
  dialogueIndex = 0;
  sunY = 540;
  promptIndex = 0;
  lastIndex = -1;
  promptText.text = '';
  menuMusic.play();
  lady.alpha = 1.0;
  sunlight.alpha = 1.0;
  desk.alpha = 1.0;
  promptText.y = 100;
  promptText.alpha = 1.0;
  promptText.setScale(0.25);
}

function menuState() {
  if (sunY > 300) {
    sunY -= 0.1;
    sunlight.y = sunY;
  }
  
  if (promptIndex < menuDialogue[dialogueIndex].length) {
    if (lastIndex != Math.round(promptIndex)) {
      let nextChar = menuDialogue[dialogueIndex][Math.round(promptIndex)];
      nextChar = nextChar ? nextChar : '';
      promptText.text = promptText.text.concat(nextChar);
      lastIndex = Math.round(promptIndex);
      if (beepCount % 2 == 0) {
        beep.play();
      }
      beepCount++;
    }
    promptIndex += 0.8;
  } else {
    nextText.text = 'Press Space'
    if (keySpace.isDown && dialogueIndex < menuDialogue.length - 1) {
      dialogueIndex++;
      promptText.text = '';
      promptIndex = 0;
      lastIndex = -1;
      nextText.text = '';
    } else if (keySpace.isDown && dialogueIndex == menuDialogue.length - 1) {
      state = 'end-menu';
    }
  }
}

function endMenuState() {
  lady.alpha -= 0.01;
  sunlight.alpha -= 0.01;
  desk.alpha -= 0.01;
  promptText.text = '';
  nextText.text = '';
  
  if (lady.alpha == 0) {
    state = 'question';
    stateLoaded = false;
  }
}

function loadQuestionState() {
  questionIndex = 0;
  curQuestion = questions[questionIndex].question;
  promptIndex = 0;
  lastIndex = -1;
  answers = [];
  nextText.text = "Use the arrow keys and \"enter\" to select";
}

function questionState() {
  if (promptIndex < curQuestion.length - 1) {
    if (lastIndex != Math.round(promptIndex)) { 
      let nextChar = curQuestion[Math.round(promptIndex)];
      nextChar = nextChar ? nextChar : '';
      promptText.text = promptText.text.concat(nextChar);
      lastIndex = Math.round(promptIndex);
      if (beepCount % 2 == 0) {
        beep.play();
      }
      beepCount++;
    }
    promptIndex += 0.8;
  } else {
    for (let i = 0; i < questions[questionIndex].answers.length; i++) {
      answer_text[i].text = questions[questionIndex].answers[i];
      if (i == selection) {
        answer_text[i].text = answer_text[i].text.concat('<<');
      }
    }

    if (keyUp.isDown && selection > 0 && !pressed) {
      selection--;
      pressed = true;
    } else if (keyDown.isDown && selection < questions[questionIndex].answers.length - 1 && !pressed) {
      selection++;
      pressed = true;
    } else if (keyEnter.isDown) {
      submitAnswer();
    }
    
    if (!keyUp.isDown && !keyDown.isDown) {
      pressed = false;
    }
  }
}

function submitAnswer() {
  answers.push(selection);
  selection = 0;
  questionIndex++;
  promptIndex = 0;
  lastIndex = -1;
  promptText.text = '';
  for (answer of answer_text) {
    answer.text = '';
  }

  if (questionIndex == questions.length) {
    scoreAnswers();
    calculateFuture();
    state = 'life';
    stateLoaded = false;
    console.log(score);
    return;
  }

  curQuestion = questions[questionIndex].question;
}

function scoreAnswers() {
  let answer;
  let category;
  for (let i = 0; i < answers.length; i++) {
    answer = answers[i];
    category = questions[i].categories[answer];
    score[category] += questions[i].scores[answer];
  }
}

function calculateFuture() {
  let creativity = Math.random() + score.creativity;
  let integrity = Math.random() + score.integrity;
  let love = Math.random() + score.love;
  let ambition = Math.random() + score.ambition;
  console.log(creativity, integrity, love, ambition);
  
  if (ambition >= 1.5) {
    job = "CEO";
    lifeDialogue.push("Throughout your life you found great success. You made your way to the top and became CEO of a succesful company.");
    positivity += 0.2;
  } else if (ambition > 0.7 && creativity > 0.7) {
    job = "Musician";
    lifeDialogue.push("Early on in life you found a passion for art and creativity. You practiced every day and became a successful musician.");
    positivity += 0.2;
  } else if (ambition > 0.5 && love > 0.7) {
    job = "Healthcare Worker";
    lifeDialogue.push("You became an extremely caring person. You compassion for others led you to a fulfilling life as a healthcare worker.");
    positivity += 0.2;
  } else if (ambition > 0.5 && integrity < 0.5) {
    job = "Car Sales Person"
    lifeDialogue.push("You had great ambition but found difficulty in following the rules and considering others. You became a car sales person.");
    positivity += 0.1;
  } else if (ambition >= 0.4) {
    job = "Engineer";
    lifeDialogue.push("From early on you were driven and focused. Your ambition and desire to create led you to a fruitful career as an engineer.");
    positivity += 0.2;
  } else {
    lifeDialogue.push("You had trouble staying focused and gaining the trust of others. Without a direction you were unable to settle into a career.");
  }

  if (love > 0.7) {
    married = true;
    lifeDialogue.push("Your empathy and caring attracted others and you were able to find a life partner.");
    positivity += 0.2;
  } else {
    lifeDialogue.push("Whether due to your immense focus in other areas or your lack of interest, you never found yourself in a stable relationship.");
  }
  
  if (married && ambition > 0.7) {
    kids = true;
    lifeDialogue.push("As a result of your great love for each other and your desire to share that love further, you and your partner decided to have children of your own.");
    positivity += 0.2;
  } else if (married) {
    lifeDialogue.push("Due to your immense focus on your own careers, you and your partner decided not to have children.");
  } else {
    lifeDialogue.push("Without a partner in life, you decided that caring for children on your own would be too difficult.");
  }

  if (married && integrity < 0.6) {
    if (job != "None") {
      lifeDialogue.push("The pressures of family life combined with the difficulty of balancing careers of your own proved too much. You and your partner grew apart and eventually you decided to separate.");
    } else {
      lifeDialogue.push("The pressures of family life and the stress of your lack of career proved too much. You and your partner grew apart and eventually decided to separate.");
      positivity -= 0.1;
    }
    positivity -= 0.1;
    divorced = true;
  } else if (married) {
    positivity += 0.2;
  }

  if (job != "None" && integrity < 0.5) {
    fired = true;
    positivity -= 0.1;
    lifeDialogue.push("Over time you became less motivated in your job and stopped performing the way you once did. Eventually, this began to show and your career came to an early end.");
  } else if (job != "None") {
    lifeDialogue.push("Your great skill and drive pushed your forward in your career and brought you success throughout your life.");
    positivity += 0.1;
  }
  console.log(job, married, kids, divorced, fired, positivity);
}

function loadLifeState() {
  promptText.text = '';
  promptIndex = 0;
  nextText.text = '';
  lastIndex = -1;
  dialogueIndex = 0;
  menuMusic.stop();
  if (positivity > 0.5) {
    upbeatMusic.play();
  } else {
    somberMusic.play();
  }
  lifeDialogue.push("If your life didn't turn out the way you expected, don't worry...");
  lifeDialogue.push("...there is beauty in the randomness...");
  lifeDialogue.push("...because after all life is...");
  lifeDialogue.push("Unstable");
  textScale = 0.25;
  textOpacity = 0.0;
  promptText.y = 240;
}

function lifeState() {
  if (textOpacity <= 1.0 && dialogueIndex < lifeDialogue.length - 1) {
    promptText.text = lifeDialogue[dialogueIndex];
    promptText.alpha = textOpacity;
    textOpacity += 0.0025;
  } else if(dialogueIndex == lifeDialogue.length - 1 && textOpacity < 1.0) {
    textScale += 0.000625;
    textOpacity += 0.0025;
    promptText.text = lifeDialogue[dialogueIndex];
    promptText.setScale(textScale);
    promptText.alpha = textOpacity;
  } else {
    if (dialogueIndex == lifeDialogue.length - 1) {
      nextText.text = 'Press Space to start over';
    } else {
      nextText.text = 'Press Space';
    }
    if (keySpace.isDown && dialogueIndex < lifeDialogue.length - 1) {
      dialogueIndex++;
      nextText.text = '';
      textOpacity = 0.0;
    } else if (keySpace.isDown && dialogueIndex >= lifeDialogue.length - 1) {
      state = 'menu';
      lifeDialogue = [];
      stateLoaded = false;
      nextText.text = '';
      if (positivity > 0.5) {
        upbeatMusic.stop();
      } else {
        somberMusic.stop();
      }
    }
  }
}
