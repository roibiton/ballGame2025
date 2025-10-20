'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const GLUE = 'GLUE'

const GLUE_IMG = '⏳'
const GAMER_IMG = '<img src="img/gamer.png">'
const BALL_IMG = '🍗'
const eatingSound = new Audio('sound/eating-sound.mp3')

var gBoard
var gGamerPos
var gBallsInterval
var gGlueInterval
var gGlueTimeout
var gBallsCounter = 5
var gScore = 0
var gNeighborsCount = 0
var gIsStuck = false
var isWinner = false

function initGame() {
	gGamerPos = { i: 2, j: 9 }
	gBoard = buildBoard()
	renderBoard(gBoard)
	gGlueInterval = setInterval(addGlue, 3000)
	gBallsInterval = setInterval(addBalls, 2000)
}

function buildBoard() {
	const board = createMat(10, 12)
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			board[i][j] = { type: FLOOR, gameElement: null }

			if (i === 0 || i === board.length - 1 || j === 0 || j === board[i].length - 1) {
				board[i][j].type = WALL
			}
		}
	}
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
	board[4][4].gameElement = BALL
	board[8][2].gameElement = BALL
	board[3][7].gameElement = BALL
	board[8][6].gameElement = BALL
	board[1][2].gameElement = BALL
	board[0][5].type = FLOOR
	board[9][5].type = FLOOR
	board[5][0].type = FLOOR
	board[5][11].type = FLOOR

	return board
}

function renderBoard(board) {
	const elBoard = document.querySelector('.board')
	var strHTML = ''
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n'
		for (var j = 0; j < board[0].length; j++) {
			const currCell = board[i][j]
			var cellClass = getClassName({ i: i, j: j })
			if (currCell.type === FLOOR) cellClass += ' floor'
			else if (currCell.type === WALL) cellClass += ' wall'
			strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})">`
			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG
			}
			strHTML += '</td>\n'
		}
		strHTML += '</tr>\n'
	}
	elBoard.innerHTML = strHTML
}

function moveTo(i, j) {
	if (gIsStuck || isWinner) return
	var targetI = i
	var targetJ = j
	var isTeleport = false
	//try to check by the index
	if (targetI === -1 && targetJ === gGamerPos.j && gBoard[0][targetJ].type === FLOOR) {
		targetI = gBoard.length - 1
		isTeleport = true
	} else if (targetI === gBoard.length && targetJ === gGamerPos.j && gBoard[gBoard.length - 1][targetJ].type === FLOOR) {
		targetI = 0
		isTeleport = true
	}
	else if (targetJ === -1 && targetI === gGamerPos.i && gBoard[targetI][0].type === FLOOR) {
		targetJ = gBoard[0].length - 1
		isTeleport = true
	} else if (targetJ === gBoard[0].length && targetI === gGamerPos.i && gBoard[targetI][gBoard[0].length - 1].type === FLOOR) {
		targetJ = 0
		isTeleport = true
	}
	const toCell = gBoard[targetI][targetJ]
	if (toCell.type === WALL && !isTeleport) return

	if (!isTeleport) {
		const iAbsDiff = Math.abs(targetI - gGamerPos.i)
		const jAbsDiff = Math.abs(targetJ - gGamerPos.j)
		if (iAbsDiff + jAbsDiff !== 1) {
			console.log('TOO FAR', iAbsDiff, jAbsDiff)
			return
		}
	}
	if (toCell.gameElement === BALL) {
		gBallsCounter--
		gScore++
		renderScore()
		eatingSound.play()

		if (gBallsCounter === 0) {
			clearInterval(gBallsInterval)
			var elModal = document.querySelector('.modal h2')
			elModal.innerText = `Nice! You collected ${gScore} chickens's`
			openModal()
			isWinner = true
		}
	}
	if (toCell.gameElement === GLUE) {
		gIsStuck = true
		setTimeout(() => {
			gIsStuck = false
		}, 3000)
	}
	// TODO: Move the gamer
	// Origin model
	gBoard[gGamerPos.i][gGamerPos.j].gameElement = null

	// Origin DOM
	renderCell(gGamerPos, '')

	// Destination model
	gBoard[targetI][targetJ].gameElement = GAMER
	gGamerPos = { i: targetI, j: targetJ }
	console.log(gBoard[targetI][targetJ])

	// Destination DOM
	renderCell(gGamerPos, GAMER_IMG)

	gNeighborsCount = countNeighbors(gBoard, gGamerPos.i, gGamerPos.j)
	renderNeighbors()
}

function handleKey(event) {
	var i = gGamerPos.i
	var j = gGamerPos.j

	switch (event.key) {
		case 'ArrowLeft':
			moveTo(i, j - 1)
			break
		case 'ArrowRight':
			moveTo(i, j + 1)
			break
		case 'ArrowUp':
			moveTo(i - 1, j)
			break
		case 'ArrowDown':
			moveTo(i + 1, j)
			break
	}
}


function addBalls() {
	var emptyCells = getEmptyCells(gBoard)
	if (isWinner || emptyCells.length <= 0) return
	var randIdx = getRandomInt(0, emptyCells.length)
	var emptyCell = emptyCells[randIdx]
	gBoard[emptyCell.i][emptyCell.j].gameElement = BALL
	renderCell(emptyCell, BALL_IMG)
	gBallsCounter++
	gNeighborsCount = countNeighbors(gBoard, gGamerPos.i, gGamerPos.j)
	renderNeighbors()

}

function addGlue() {
	var emptyCells = getEmptyCells(gBoard)
	if (gIsStuck || isWinner || emptyCells.length <= 0) return
	var randIdx = getRandomInt(0, emptyCells.length)
	var emptyCell = emptyCells[randIdx]
	const cellSelector = '.' + getClassName(emptyCell)
	const elCell = document.querySelector(cellSelector)
	elCell.classList.add('glue')
	gBoard[emptyCell.i][emptyCell.j].gameElement = GLUE
	renderCell(emptyCell, GLUE_IMG)
	setTimeout(() => {
		elCell.classList.remove('glue')
		if (gIsStuck) return
		removeGlue(emptyCell)
	}, 3000)
}

function removeGlue(pos) {
	gBoard[pos.i][pos.j].gameElement = null
	renderCell(pos, '')
}

function getEmptyCells(board) {
	const emptyCells = []
	for (var i = 1; i < board.length - 1; i++) {
		for (var j = 1; j < board[i].length - 1; j++) {
			var currCell = board[i][j]
			if (currCell.gameElement === null && currCell.type === FLOOR) {
				emptyCells.push({ i, j })
			}
		}
	}
	if (!emptyCells.length) return null
	return emptyCells
}

function countNeighbors(board, row, col) {
	var neighborsCount = 0
	for (var i = row - 1; i <= row + 1; i++) {
		for (var j = col - 1; j <= col + 1; j++) {
			if (!(i === row && j === col) && !(i < 0 || j < 0) && !(i >= board.length || j >= board[i].length)) {
				if (board[i][j].gameElement === BALL) neighborsCount++
			}
		}
	}
	return neighborsCount
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	const cellSelector = '.' + getClassName(location)
	const elCell = document.querySelector(cellSelector)
	elCell.innerHTML = value
}


function renderNeighbors() {
	const elScores = document.querySelector('.neighbors-container')
	elScores.innerHTML = `<div class="neighbors-counter"> Neighbors: ${gNeighborsCount}</div>`
}

function renderScore() {
	var elScores = document.querySelector('.score-container')
	elScores.innerHTML = `<div class="score"> Score: ${gScore}</div>`
}
function openModal() {
	const elModal = document.querySelector('.modal')
	elModal.style.opacity = 1
	elModal.style.zIndex = 100
}

function onCloseModal() {
	const elModal = document.querySelector('.modal')
	elModal.style.opacity = 0
	elModal.style.zIndex = -100
	gBallsCounter = 5
	gScore = 0
	gNeighborsCount = 0
	gIsStuck = false
	if (gBallsInterval) clearInterval(gBallsInterval)
	if (gGlueInterval) clearInterval(gGlueInterval)
	if (gGlueTimeout) clearTimeout(gGlueTimeout)
	renderScore()
	isWinner = false
	initGame()
}

// Returns the class name for a specific cell
function getClassName(position) {
	const cellClass = `cell-${position.i}-${position.j}`
	return cellClass
}

// function addBalls() {
// 	gBallsInterval = setInterval(() => {
// 		var newBallPos = { i: getRandomInt(1, gBoard.length - 1), j: getRandomInt(1, gBoard[0].length - 1) }
// 		var currPos = gBoard[newBallPos.i][newBallPos.j]
// 		if (currPos.type === FLOOR && currPos.gameElement === null && currPos.gameElement !== GAMER) {
// 			currPos.gameElement = BALL
// 			renderCell(newBallPos, BALL_IMG)
// 			gBallsCounter++
// 			gNeighborsCount = countNeighbors(gBoard, gGamerPos.i, gGamerPos.j)
// 			renderNeighbors()
// 		}
// 		else {
// 			clearInterval(gBallsInterval)
// 			addBalls()
// 		}
// 	}, 3000)
// }