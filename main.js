let boardSquaresArray = [];
let isWhiteTurn = true;
let whiteKingSquare = "e1";
let blackKingSquare = "e8";
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementsByClassName("piece");
const piecesImages = document.getElementsByTagName("img");

function fillBoardSquaresArray() {
  for (let i = 0; i < boardSquares.length; i++) {
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    let square = boardSquares[i];
    square.id = column + row;
    let color = "blank";
    let pieceType = "blank";
    let pieceId = "blank";
    
    const pieceElement = square.querySelector(".piece");
    if (pieceElement) {
      color = pieceElement.getAttribute("color");
      pieceType = pieceElement.classList[1];
      pieceId = pieceElement.id;
    }
    
    let arrayElement = {
      squareId: square.id,
      pieceColor: color,
      pieceType: pieceType,
      pieceId: pieceId
    };
    boardSquaresArray.push(arrayElement);
  }
}

function updateBoardSquaresArray(currentSquareId, destinationSquareId) {
  let currentSquare = boardSquaresArray.find(element => element.squareId === currentSquareId);
  let destinationSquareElement = boardSquaresArray.find(element => element.squareId === destinationSquareId);
  destinationSquareElement.pieceColor = currentSquare.pieceColor;
  destinationSquareElement.pieceType = currentSquare.pieceType;
  destinationSquareElement.pieceId = currentSquare.pieceId;
  currentSquare.pieceColor = "blank";
  currentSquare.pieceType = "blank";
  currentSquare.pieceId = "blank";
}

function deepCopyArray(array) {
  return array.map(element => ({ ...element }));
}

function setupBoardSquares() {
  for (let i = 0; i < boardSquares.length; i++) {
    boardSquares[i].addEventListener("dragover", allowDrop);
    boardSquares[i].addEventListener("drop", drop);
    let row = 8 - Math.floor(i / 8);
    let column = String.fromCharCode(97 + (i % 8));
    boardSquares[i].id = column + row;
  }
}

function setupPieces() {
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].addEventListener("dragstart", drag);
    pieces[i].setAttribute("draggable", true);
    pieces[i].id = pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
  }
  for (let i = 0; i < piecesImages.length; i++) {
    piecesImages[i].setAttribute("draggable", false);
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  const piece = ev.target;
  const pieceColor = piece.getAttribute("color");
  const pieceType = piece.classList[1];
  const pieceId = piece.id;

  if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black")) {
    const startingSquareId = piece.parentNode.id;
    ev.dataTransfer.setData("text", pieceId + "|" + startingSquareId);
    const pieceObject = { pieceColor, pieceType, pieceId };
    let legalSquares = getPossibleMoves(startingSquareId, pieceObject);
    let legalSquaresJson = JSON.stringify(legalSquares);
    ev.dataTransfer.setData("application/json", legalSquaresJson);
  }
}

function drop(ev) {
  ev.preventDefault();
  let data = ev.dataTransfer.getData("text");
  let [pieceId, startingSquareId] = data.split("|");
  let legalSquaresJson = ev.dataTransfer.getData("application/json");
  let legalSquares = JSON.parse(legalSquaresJson);

  const piece = document.getElementById(pieceId);
  const destinationSquare = ev.currentTarget;
  let destinationSquareId = destinationSquare.id;

  legalSquares = isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType);

  if (pieceType === "king") {
    let isCheck = isKingInCheck(destinationSquareId, pieceColor);
    if (isCheck) return;
    isWhiteTurn ? (whiteKingSquare = destinationSquareId) : (blackKingSquare = destinationSquareId);
  }

  let squareContent = getPieceAtSquare(destinationSquareId);
  if (squareContent.pieceColor === "blank" && legalSquares.includes(destinationSquareId)) {
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updateBoardSquaresArray(startingSquareId, destinationSquareId);
    checkForCheckMate();
    return;
  }

  if (squareContent.pieceColor !== "blank" && legalSquares.includes(destinationSquareId)) {
    for (let i = 0; i < destinationSquare.children.length; i++) {
      if (!destinationSquare.children[i].classList.contains('coordinate')) {
        destinationSquare.removeChild(destinationSquare.children[i]);
      }
    }
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updateBoardSquaresArray(startingSquareId, destinationSquareId);
    checkForCheckMate();
    return;
  }
}

function getPossibleMoves(startingSquareId, piece) {
  const pieceColor = piece.pieceColor;
  const pieceType = piece.pieceType;

  let legalSquares = [];
  switch (pieceType) {
    case "pawn":
      legalSquares = getPawnMoves(startingSquareId, pieceColor);
      break;
    case "knight":
      legalSquares = getKnightMoves(startingSquareId, pieceColor);
      break;
    case "rook":
      legalSquares = getRookMoves(startingSquareId, pieceColor);
      break;
    case "bishop":
      legalSquares = getBishopMoves(startingSquareId, pieceColor);
      break;
    case "queen":
      legalSquares = getQueenMoves(startingSquareId, pieceColor);
      break;
    case "king":
      legalSquares = getKingMoves(startingSquareId, pieceColor);
      break;
  }
  return legalSquares;
}

//pawn moves
function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let diogonalSquares = checkPawnDiagonalCaptures(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let forwardSquares = checkPawnForwardMoves(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [...diogonalSquares, ...forwardSquares];
  return legalSquares;
}


//check for pawn captures
function checkPawnDiagonalCaptures(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];
  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
 if(!(rank==8 && direction==1) && !(rank==1 && direction==-1))
   currentRank += direction;
  for (let i = -1; i <= 1; i += 2) {
    currentFile = String.fromCharCode(file.charCodeAt(0) + i);
    if (currentFile >= "a" && currentFile <= "h" && currentRank<=8 && currentRank>=1){
      currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent != pieceColor)
        legalSquares.push(currentSquareId);
    }
  }
  return legalSquares;
}

//cheking if pawn can move forward
function checkPawnForwardMoves(
  startingSquareId,
  pieceColor,
  boardSquaresArray
) {
  const file = startingSquareId.charAt(0);
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let legalSquares = [];

  let currentFile = file;
  let currentRank = rankNumber;
  let currentSquareId = currentFile + currentRank;

  const direction = pieceColor == "white" ? 1 : -1;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  let currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  );
  let squareContent = currentSquare.pieceColor;
  if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  if (rankNumber != 2 && rankNumber != 7) return legalSquares;
  currentRank += direction;
  currentSquareId = currentFile + currentRank;
  currentSquare = boardSquaresArray.find(
    (element) => element.squareId === currentSquareId
  );
  squareContent = currentSquare.pieceColor;
  if (squareContent != "blank")
    if (squareContent != "blank") return legalSquares;
  legalSquares.push(currentSquareId);
  return legalSquares;
}

//knight moves
function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  const moves = [
    [-2, 1],
    [-1, 2],
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
  ];
  moves.forEach((move) => {
    currentFile = file + move[0];
    currentRank = rankNumber + move[1];
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}

//rook moves
function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let moveToEighthRankSquares = moveToEighthRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankSquares = moveToFirstRank(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToAFileSquares = moveToAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToHFileSquares = moveToHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankSquares,
    ...moveToFirstRankSquares,
    ...moveToAFileSquares,
    ...moveToHFileSquares,
  ];
  return legalSquares;
}

//bishop moves
function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let moveToEighthRankHFileSquares = moveToEighthRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToEighthRankAFileSquares = moveToEighthRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankHFileSquares = moveToFirstRankHFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let moveToFirstRankAFileSquares = moveToFirstRankAFile(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let legalSquares = [
    ...moveToEighthRankHFileSquares,
    ...moveToEighthRankAFileSquares,
    ...moveToFirstRankHFileSquares,
    ...moveToFirstRankAFileSquares,
  ];
  return legalSquares;
}

//queen moves
function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
  let bishopMoves = getBishopMoves(
    startingSquareId,
    pieceColor,
    boardSquaresArray
  );
  let rookMoves = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
  let legalSquares = [...bishopMoves, ...rookMoves];
  return legalSquares;
}

//king moves
function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
  const file = startingSquareId.charCodeAt(0) - 97;
  const rank = startingSquareId.charAt(1);
  const rankNumber = parseInt(rank);
  let currentFile = file;
  let currentRank = rankNumber;
  let legalSquares = [];

  const moves = [
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 0],
    [-1, -1],
    [-1, 1],
    [1, 0],
  ];

  
  moves.forEach((move) => {
    currentFile = file + move[0];
    currentRank = rankNumber + move[1];
    if (
      currentFile >= 0 &&
      currentFile <= 7 &&
      currentRank > 0 &&
      currentRank <= 8
    ) {
      let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
      let currentSquare = boardSquaresArray.find(
        (element) => element.squareId === currentSquareId
      );
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
    }
  });
  return legalSquares;
}