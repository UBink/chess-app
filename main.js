let legalSquares = [];
const boardSquares = document.getElementsByClassName("square");
const pieces = document.getElementById("piece");
const piecesImages = document.getElementsByTagName("img");

//turns funtionality
let isWhiteTurn = true;

setUpBoardSquares()
setupPieces();
// Setting up the board
const setUpBoardSquares = () => {
    for (let i = 0; i < boardSquares.length; i++) {
        //Event listener for the board
        boardSquares[i].addEventListener("dragover", allowDrop);
        boardSquares[i].addEventListener("drop", drop);
        //columns and rows
        let row = 8 - Math.floor(i / 8);
        let column = String.fromCharCode(97 + (i % 8));
        let square = boardSquares[i];
        square.id = column + row;
    }
}

//Setting up the pieces
const setupPieces = () => {
    //Setting up pieces functionality
    for (let i = 0; i < pieces.length; i++) {
        pieces.addEventListener("dragstart", drag);
        pieces.setAttribute("draggable", true);
        pieces[i].id.className.split(" ")[1] + pieces[i].parentElement.id;
    }
    
    //Prevent piece img from being draggable
    for (let i = 0; i < piecesImages.length; i++) {
        piecesImages.setAttribute("draggable", false);
    }
}
//Drag and drop functionality
const allowDrop = ev => {
    ev.preventDefault();
}

const drag = ev => {
    const piece = ev.target;
    const pieceColor = piece.getAttribute("color");
    if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black")) {
        ev.dataTransfer.setData("text", piece.id);
        const startingSquareId = piece.parentNode.id;
    }

}

const drop = ev => {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    const piece = document.getElementById(data);
    const destinationSquare = ev.currentTarget;
    let destinationSquareId = destinationSquare.id;

    if (isSquareOccupied(destinationSquare) == 'blank') {
        destinationSquare.appendChild(piece);
        isWhiteTurn = !isWhiteTurn;
        return;
    }
    if (isSquareOccupied(destinationSquare) != 'blank') {
        while (destinationSquare.firstChild) {
            destinationSquare.removeChild(destinationSquare.firstChild)
        }
        destinationSquare.appendChild(piece);
        isWhiteTurn = !isWhiteTurn;
        return;
    }
}

const isSquareOccupied = square => {
    if (square.querySelector(".piece")) {
        const color = square.querySelector('.piece').getAttribute('color');
        return color
    }
    else {
        return "blank"
    }
}