const gamesBoardContainer = document.querySelector("#game-board-container")
const optionContainer = document.querySelector(".option-container");
const flipButton = document.getElementById("flip-button");
const startButton = document.getElementById("start-button");
const infoDisplay = document.getElementById("info");
const turnDisplay = document.getElementById("turn-display");

// Piece rotation

let angle = 0

const flip = () => {
    const optionShips = Array.from(optionContainer.children)
    if (angle === 0) {
        angle = 90;
        optionShips.forEach(optionShips => {
            optionShips.style.transform = `rotate(-${angle}deg)`;
            optionContainer.style.display = `flex`;
            optionShips.style.flexShrink = "0";
        })
    }
    else {
        angle = 0;
        optionShips.forEach(optionShips => {
            optionShips.style.transform = `rotate(${angle}deg)`;
            optionContainer.style.display = `grid`;
            optionContainer.style.gridAutoRows = "60px";
        })
    }
    ;
}

flipButton.addEventListener("click", flip)

// Board creation

const width = 10;
const height = 10;

const createBoard = (color, user) => {
    const gameBoardContainer = document.createElement("div");
    gameBoardContainer.classList.add("game-board");
    gameBoardContainer.style.backgroundColor = `${color}`;
    gameBoardContainer.id = `${user}`;

    for (let i = 0; i < width * height; i++) {
        const block = document.createElement("div");
        block.classList.add("block");
        block.id = i;
        gameBoardContainer.append(block);
    }

    gamesBoardContainer.append(gameBoardContainer);
}

createBoard("cyan", "player");
createBoard("pink", "computer");

// Creating Ships

class Ship {
    constructor(name, length) {
        this.name = name
        this.length = length
    }
}

const destroyer = new Ship("destroyer", 2)
const submarine = new Ship("submarine", 3)
const cruiser = new Ship("cruiser", 3)
const battleship = new Ship("battleship", 4)
const carrier = new Ship("carrier", 5)

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

const getValidity = (allBoardBlocks, isHorizontal, startIndex, ship) => {
    
    let shipBlocks = [];

    // valid tiles check
    let validStart = isHorizontal ? startIndex <= width * height - ship.length ? startIndex :
        width * height - ship.length : 
        // vertical
        startIndex <= width * height - width * ship.length ? startIndex : 
        startIndex - ship.length * width + width;

    // random placements
    
    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i])
        }

        else {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i * width])
        }
    }

    let valid;

    if (isHorizontal) {
        shipBlocks.every((_shipBlock, index) => 
            valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)));
    }

    else {
        shipBlocks.every((_shipBlock, index) =>
            valid = shipBlocks[0].id < 90 + (width * index + 1)
        );
    }

    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains("taken"))
    return { shipBlocks, valid, notTaken}
}

const addShipPiece = (user, ship, startId) => {
    const allBoardBlocks = document.querySelectorAll(`#${user} div`);
    let randomBoolean = Math.random() < 0.5;
    let isHorizontal = user === "player" ? angle === 0 : randomBoolean;
    let randomStartIndex = Math.floor(Math.random() * width * height)

    let startIndex = startId ? startId : randomStartIndex;


    const {shipBlocks, valid, notTaken} = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name);
            shipBlock.classList.add("taken");
        })
    }

    else {
        if (user === "computer") addShipPiece(user, ship, startId);
        if (user === "player") notDropped = true;
    }
}


const highlightArea = (startIndex, ship) => {
    const allBoardBlocks = document.querySelectorAll("#player div");
    let isHorizontal = angle === 0
    const { shipBlocks, valid, notTaken} = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add("hover")
            setTimeout(()=> shipBlock.classList.remove("hover"), 500)
        })
    }
}

ships.forEach(ship => addShipPiece("computer", ship));

// Drag player ships

let draggedShip;
const optionShips = Array.from(optionContainer.children);

const dragStart = (e) => {
    notDropped = false;
    draggedShip = e.target;
}

const dragOver = (e) => {
    e.preventDefault();
    const ship = ships[draggedShip.id]
    highlightArea(e.target.id, ship)
}

const dropShip = (e) => {
    const startId = e.target.id;
    const ship = ships[draggedShip.id];
    addShipPiece("player", ship, startId);
    if (!notDropped) {
        draggedShip.remove();
    }
}

optionShips.forEach(optionShip => optionShip.addEventListener("dragstart", dragStart));

const allPlayerBlocks = document.querySelectorAll("#player div");
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener("dragover", dragOver);
    playerBlock.addEventListener("drop", dropShip)
})

let gameOver = false;
let playerTurn;

// Start Game

const startGame = () => {
    if (playerTurn === undefined) {
        if (optionContainer.children.length !== 0) {
            alert("Please place all your ships first!");
            infoDisplay.textContent = "Please place all your ships first!"
        }

        else {
            const allBoardBlocks = document.querySelectorAll("#computer div");
            allBoardBlocks.forEach(block => block.addEventListener("click", handleClick))
            playerTurn = true;
            turnDisplay.textContent = "Your turn."
            infoDisplay.textContent = "The game has started."
        }
    }
}
startButton.addEventListener("click", startGame)

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];

const handleClick = (e) => {
    if (!gameOver) {
        if (e.target.classList.contains("taken")) {
            e.target.classList.add("boom");
            infoDisplay.textContent = "You hit the computer's ship!";
            let classes = Array.from(e.target.classList);
            classes = classes.filter(className => className !=="block");
            classes = classes.filter(className => className !=="boom");
            classes = classes.filter(className => className !=="taken");
            playerHits.push(...classes);
            checkScore("player", playerHits, playerSunkShips);
        }
        if (!e.target.classList.contains("taken")) {
            infoDisplay.textContent = "Missed!";
            e.target.classList.add("empty");
        }
        playerTurn = false;
        const allBoardBlocks = document.querySelectorAll("#computer div");
        allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)));
        setTimeout(computerTurn, 3000);
    }
}

// Define computer's turn

const computerTurn = () => {
    if (!gameOver) {
        turnDisplay.textContent = "Computer's Turn.";
        infoDisplay.textContent = "Computer is thinking...";

        setTimeout(()=> {
            let randomHit = Math.floor(Math.random() * width * height);
            const allBoardBlocks = document.querySelectorAll("#player div");
            
            if (allBoardBlocks[randomHit].classList.contains("taken") && 
                allBoardBlocks[randomHit].classList.contains("boom")
            ) {
                computerTurn();
                return;
            } 
            
            else if (
                allBoardBlocks[randomHit].classList.contains("taken") && 
                !allBoardBlocks[randomHit].classList.contains("boom")
            ) {
                allBoardBlocks[randomHit].classList.add("boom");
                infoDisplay.textContent = "The computer hit your ship!";
                let classes = Array.from(allBoardBlocks[randomHit].classList);
                classes = classes.filter(className => className !=="block");
                classes = classes.filter(className => className !=="boom");
                classes = classes.filter(className => className !=="taken");
                computerHits.push(...classes);
                checkScore("computer", computerHits, computerSunkShips);
            }

            else {
                infoDisplay.textContent = "Missed!";
                allBoardBlocks[randomHit].classList.add("empty");

            }
        }, 3000)

        setTimeout(() => {
            playerTurn = true;
            turnDisplay.textContent = "Player's turn.";
            infoDisplay.textContent = "It is your turn.";
            const allBoardBlocks = document.querySelectorAll("#computer div")
            allBoardBlocks.forEach(block => block.addEventListener("click", handleClick));
        }, 6000)
    }
}

const checkScore = (user, userHits, userSunkShips) => {
    const checkShip = (shipName, shipLength) => {
        if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {
            
            if (user === "player") {
                infoDisplay.textContent = `You sunk the computer's ${shipName}!`;
                playerHits = userHits.filter(storedShipName => storedShipName !== shipName);
                
            }
            if (user === "computer") {
                infoDisplay.textContent = `The computer sunk your ${shipName}!`;
                computerHits = userHits.filter(storedShipName => storedShipName !== shipName);
                
            }

            userSunkShips.push(shipName)
        }
    }

    checkShip("destroyer", 2);
    checkShip("submarine", 3);
    checkShip("cruiser", 3);
    checkShip("battleship", 4);
    checkShip("carrier", 5);

    console.log("playerHits", playerHits);
    console.log("playerSunkShips", playerSunkShips);

    if (playerSunkShips.length === 5) {
        infoDisplay.textContent = "You sunk all the computer's ships. YOU WON!"
        gameOver = true;
    }

    if (playerSunkShips.length === 5) {
        infoDisplay.textContent = "The computer sunk all your ships. GAME OVER!"
        gameOver = true;
    }
}