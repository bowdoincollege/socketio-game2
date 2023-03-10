import socket from '../socket';
import './moveablock.css';

const BOARD_DIM = {w: 18, h: 6};

const SECTION_NUM = 3;

const SUB_SECTION_NUM = 2;

const SECTION_WIDTH = BOARD_DIM.w/SECTION_NUM;

const SUB_SECTION_WIDTH = SECTION_WIDTH/SUB_SECTION_NUM;

let gameState = {
    board: []
}

let pieceIdCounter = 0;

const generatePieceId = () => {
    pieceIdCounter = pieceIdCounter + 1;

    return 'piece' + pieceIdCounter.toString();
};

const initBoardState = () => {
    gameState.board = [...Array(BOARD_DIM.h)].map(_=>Array(BOARD_DIM.w).fill(0));
}

const initBoardBlocks = () => {
    gameState.board[0][0] = 1;
    gameState.board[0][1] = 1;
    gameState.board[0][2] = 2;
    gameState.board[0][3] = 2;
    gameState.board[0][4] = 1;
    gameState.board[0][5] = 3;

    gameState.board[0][6] = 1;
    gameState.board[0][7] = 1;
    gameState.board[0][8] = 2;
    gameState.board[0][9] = 2;
    gameState.board[0][10] = 1;
    gameState.board[0][11] = 3;

    //gameState.board[0][12] = 1;
    //gameState.board[0][13] = 1;
    gameState.board[0][14] = 2;
    gameState.board[0][15] = 2;
    gameState.board[0][16] = 1;
    gameState.board[0][17] = 3;

    gameState.board[1][0] = 3;
    gameState.board[1][1] = 3;
    gameState.board[1][2] = 2;
    gameState.board[1][3] = 2;
    gameState.board[1][4] = 1;
    gameState.board[1][5] = 3;

    gameState.board[1][6] = 3;
    gameState.board[1][7] = 1;
    //gameState.board[1][8] = 2;
    gameState.board[1][9] = 3;
    //gameState.board[1][10] = 1;
    gameState.board[1][11] = 3;

    gameState.board[0][12] = 3;
    //gameState.board[1][13] = 1;
    gameState.board[1][14] = 2;
    gameState.board[1][15] = 2;
    gameState.board[1][16] = 1;
    //gameState.board[1][17] = 3;

}

const flipY = (y, h) => {
    return Math.abs(y - (h-1));
}

const buildBoard = () => {

    const board = document.getElementById('board');

    board.innerHTML = '';

    var prevSection = 1;
    var prevSubsection = 1;

    for(let y = 0; y < BOARD_DIM.h; y++) {
        var row = board.insertRow(y);
        for(let x = 0; x < BOARD_DIM.w; x++) {
            var cell = row.insertCell(x);

            cell.setAttribute('id', 'cell-' + x.toString() + (flipY(y, BOARD_DIM.h)).toString());
            cell.setAttribute('data-x', x.toString());
            cell.setAttribute('data-y', (flipY(y, BOARD_DIM.h)).toString());

            var section = Math.floor(x/SECTION_WIDTH + 1);
            var subsection = Math.floor((x - (section-1) * SECTION_WIDTH)/SUB_SECTION_WIDTH + 1);
            var isSectionLeftEdge = section - prevSection > 0;
            var isSubSectionLeftEdge = subsection - prevSubsection > 0;

            cell.setAttribute('data-section', section.toString());
            cell.setAttribute('data-subsection', subsection.toString());
            
            if (isSectionLeftEdge) {
                cell.classList.add('section-left-edge');
            }

            if (isSubSectionLeftEdge) {
                cell.classList.add('subsection-left-edge');
            }

            // add block
            addBlock(cell, x, flipY(y, BOARD_DIM.h));
            addDragListeners(cell);

            prevSection = section;
            prevSubsection = subsection;
        }
    };
};

const addBlock = (cell, x, y) => {
    var blockState = gameState.board[y][x];

    if (blockState > 0) {
        var block = document.createElement('div');
        block.classList.add('block', 'group-' + blockState);
        block.setAttribute('draggable', 'true');
        block.setAttribute('id', generatePieceId());
        block.setAttribute('data-x', x.toString());
        block.setAttribute('data-y', y.toString());

        block.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
        });

        cell.appendChild(block);
    }
};

const getElementPosition = (element) => {
    var posX = parseInt(element.getAttribute('data-x'));
    var posY = parseInt(element.getAttribute('data-y'));

    return {x: posX, y: posY};
};

const addDragListeners = (element) => {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    element.addEventListener('drop', (e) => {
        e.preventDefault();
    
        var data = e.dataTransfer.getData('text/plain');
        var block = document.getElementById(data);
        var newPos = getElementPosition(e.target);
        var currentPos = getElementPosition(block);

        var spaceIsEmpty = gameState.board[newPos.y][newPos.x] == 0;
        var spaceHasBlockBelowOrFloor = newPos.y == 0 || gameState.board[newPos.y - 1][newPos.x] > 0;
        var spaceBelowIsNotCurrentPos = !(currentPos.x == newPos.x && newPos.y - 1 == currentPos.y);
        var noBlockAboveOrCeiling = currentPos.y == (BOARD_DIM.h - 1) ||
            gameState.board[currentPos.y + 1][currentPos.x] == 0;

        if (spaceIsEmpty && spaceHasBlockBelowOrFloor && spaceBelowIsNotCurrentPos && noBlockAboveOrCeiling) {
            e.target.appendChild(block);
            block.setAttribute('data-x', newPos.x.toString());
            block.setAttribute('data-y', newPos.y.toString());

            gameState.board[newPos.y][newPos.x] = gameState.board[currentPos.y][currentPos.x];
            gameState.board[currentPos.y][currentPos.x] = 0;

            socket.emit('moveablock', gameState);
        }
        
    });
};

initBoardState();
initBoardBlocks();

// Build the board
buildBoard();

socket.on('moveablock', (event) => {
    gameState = event;
    buildBoard();
});
