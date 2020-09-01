(() => {
    const BOARD_SIZE = 3
    const PLAYER_X = `x`
    const PLAYER_O = `o`
    const EMPTY_CELL = null
    const GAME_STATUS_PLAYING = 'playing'
    const GAME_STATUS_FINISHED = 'finished'
    const ENDING_MODE_REGULAR = 'regular'
    const ENDING_MODE_SUICIDE = 'suicide'

    const SYMBOLS = {}
    SYMBOLS[PLAYER_X] = `&times;`
    SYMBOLS[PLAYER_O] = `&#9675;`

    const getRandomArrayElement = (array) => array[Math.floor(Math.random() * array.length)]

    const game = {
        rootEl: document.querySelector(`#app`),
        board: [],
        nextTurn: null,
        player: null,
        cpu: null,
        endingMode: ENDING_MODE_REGULAR,
        startNewGame() {
            this.board = []
            this.status = GAME_STATUS_PLAYING
            this.initBoard()

            if (Math.random() >= .5) {
                this.player = PLAYER_X
                this.cpu = PLAYER_O
            } else {
                this.player = PLAYER_O
                this.cpu = PLAYER_X
            }
            this.nextTurn = (Math.random() >= .5) ? this.player : this.cpu
            
            if (this.nextTurn === this.cpu) {
                this.makeCpuTurn()
            }
        },
        initBoard() {
            this.board = []
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (!Array.isArray(this.board[i])) {
                    this.board[i] = []
                }

                for (let j = 0; j < BOARD_SIZE; j++) {
                    this.board[i][j] = EMPTY_CELL
                }
            }
        },
        cloneBoard(boardInput) {
            return boardInput.map((row) => row.slice())
        },
        isGameFinished() {
            return this.status === GAME_STATUS_FINISHED
        },
        getNumberOfTurnsLeft() {
            let numberOrTurnsLeft = 0

            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (this.board[i][j] === EMPTY_CELL) {
                        numberOrTurnsLeft++
                    }
                }
            }

            return numberOrTurnsLeft
        },
        playerHasWon(player, boardInput = null) {
            const board = Array.isArray(boardInput) ? boardInput : this.board

            // Rows
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    if (board[row][col] !== player) {
                        break
                    }

                    if (col === BOARD_SIZE - 1) {
                        return true
                    }
                }
            }

            // Columns
            for (let col = 0; col < BOARD_SIZE; col++) {
                for (let row = 0; row < BOARD_SIZE; row++) {
                    if (board[row][col] !== player) {
                        break
                    }

                    if (row === BOARD_SIZE - 1) {
                        return true
                    }
                }
            }

            // Main diagonal
            for (let cell = 0; cell < BOARD_SIZE; cell++) {
                if (board[cell][cell] !== player) {
                    break
                }

                if (cell === BOARD_SIZE - 1) {
                    return true
                }
            }

            // Flipped diagonal
            for (let cell = 0; cell < BOARD_SIZE; cell++) {
                if (board[cell][BOARD_SIZE - cell - 1] !== player) {
                    break
                }

                if (cell === BOARD_SIZE - 1) {
                    return true
                }
            }

            return false
        },
        getCoordsFromEl(td) {
            const tr = td.parentNode
            const col = Array.prototype.slice.call(tr.children).indexOf(td)
            const row = Array.prototype.slice.call(tr.parentNode.children).indexOf(tr)

            return {
                row,
                col
            }
        },
        switchPlayer() {
            this.nextTurn = (this.nextTurn === this.player) ? this.cpu : this.player
        },
        isCellsEqual(cell1, cell2) {
            return cell1.row === cell2.row && cell1.col === cell2.col
        },
        getEmptyCells() {
            const emptyCells = []
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    if (this.board[row][col] === EMPTY_CELL) {
                        emptyCells.push({
                            row,
                            col
                        })
                    }
                }
            }

            return emptyCells
        },
        getRandomEmptyCell() {
            return getRandomArrayElement(this.getEmptyCells())
        },
        makeTurn(row, col) {
            if (this.board[row][col] === EMPTY_CELL) {
                this.board[row][col] = this.nextTurn

                if (this.playerHasWon(this.nextTurn)) {
                    this.status = GAME_STATUS_FINISHED
                    this.winner = this.nextTurn
                } else if (this.getNumberOfTurnsLeft() <= 0) {
                    this.status = GAME_STATUS_FINISHED
                    this.winner = null
                } else {
                    this.switchPlayer()
                    if (this.nextTurn === this.cpu) {
                        this.makeCpuTurn()
                    }
                }

                this.renderApp()
            }
        },
        findCellsToWin(player) {
            const cellsToWin = []
            const emptyCells = this.getEmptyCells()
            for (let i = 0; i < emptyCells.length; i++) {
                let board = this.cloneBoard(this.board)
                let cell = emptyCells[i]
                board[cell.row][cell.col] = player
                if (this.playerHasWon(player, board)) {
                    cellsToWin.push(cell)
                }
            }

            return cellsToWin
        },
        makeCpuTurn() {
            const emptyCells = this.getEmptyCells()
            const cellsToWinPlayer = this.findCellsToWin(this.player)
            const cellsToWinCpu = this.findCellsToWin(this.cpu)
            const goodMoves = []
            const badMoves = []
            const worstMoves = []

            // Go through all empty cells to find the best move to lose
            emptyCells.forEach((emptyCell) => {
                let cpuCanWin = cellsToWinCpu.filter((cell) => this.isCellsEqual(emptyCell, cell)).length
                let playerCanWin = cellsToWinPlayer.filter((cell) => this.isCellsEqual(emptyCell, cell)).length

                if (!cpuCanWin && !playerCanWin) {
                    // Moves when neither player nor CPU can win by are considered good ones
                    goodMoves.push(emptyCell)
                } else if (playerCanWin && !cpuCanWin) {
                    // Moves when CPU interferes player to win are bad ones
                    badMoves.push(emptyCell)
                } else {
                    // The worst moves are the moves when CPU is going to win. Time to think about suicide
                    worstMoves.push(emptyCell)
                }
            })

            let move = null
            if (goodMoves.length) {
                move = getRandomArrayElement(goodMoves)
            } else if (badMoves.length) {
                move = getRandomArrayElement(badMoves)
            } else if (worstMoves.length) {
                move = getRandomArrayElement(worstMoves)

                const randomNum = Math.random()
                if (randomNum > .05 && randomNum < .95) {
                    // Turning into suicide mode
                    this.endingMode = ENDING_MODE_SUICIDE
                    this.switchPlayer()
                }
            } else {
                move = this.getRandomEmptyCell()
                console.warn('Something went terribly wrong')
            }

            this.makeTurn(move.row, move.col)
        },
        getPlayerSymbol(player) {
            return SYMBOLS[player]
        },
        renderBoard() {
            let boardTpl = `<table id="board">`
            for (let i = 0; i < BOARD_SIZE; i++) {
                boardTpl += `<tr>`
                for (let j = 0; j < BOARD_SIZE; j++) {
                    boardTpl += `<td>${this.board[i][j] !== EMPTY_CELL ? this.getPlayerSymbol(this.board[i][j]) : ''}</td>`
                }
                boardTpl += `</tr>`
            }
            boardTpl += `</table>`
            this.rootEl.insertAdjacentHTML(`beforeend`, boardTpl)
        },
        renderGameMeta() {
            const tpl = `<div class="game-meta">
                <div>Player: ${this.getPlayerSymbol(this.player)}</div>
                <div>CPU: ${this.getPlayerSymbol(this.cpu)}</div>
                <div>Next Turn: ${this.getPlayerSymbol(this.nextTurn)}</div>
            </div>`
            this.rootEl.insertAdjacentHTML(`beforeend`, tpl)
        },
        renderWin() {
            let tpl = `<h3>You have won. Try to lose, it's not that simple</h3>`
            if (this.endingMode === ENDING_MODE_SUICIDE) {
                tpl = `<h3>That was a nice try but CPU player went mad and committed suicide, so you have won again. Give it another try, good luck!</h3>`
            }
            this.rootEl.insertAdjacentHTML(`beforeend`, tpl)
        },
        renderLose() {
            const tpl = `<h3>Congratulations! You have lost, you did the impossible thing!</h3>`
            this.rootEl.insertAdjacentHTML(`beforeend`, tpl)
        },
        renderDraw() {
            const tpl = `<h3>Draw. Try again, I trust in you!</h3>`
            this.rootEl.insertAdjacentHTML(`beforeend`, tpl)
        },
        renderActionButtons() {
            const tpl = `<div>
                <button class="play-btn" ${this.isGameFinished() ? '' : 'disabled'}>Play Again</button>
            </div>`
            this.rootEl.insertAdjacentHTML(`beforeend`, tpl)
        },
        renderApp() {
            this.rootEl.innerHTML = ``

            this.renderGameMeta()
            this.renderBoard()

            if (this.isGameFinished()) {
                if (this.winner) {
                    if (this.winner === this.player) {
                        this.renderWin()
                    } else {
                        this.renderLose()
                    }
                } else {
                    this.renderDraw()
                }
            }

            this.renderActionButtons()
        },
        bindEventHandlers() {
            this.rootEl.addEventListener('click', (e) => {
                const el = e.target

                // Click on table cell
                if (el.tagName.toLowerCase() === 'td') {
                    if (!this.isGameFinished() && this.nextTurn === this.player) {
                        const coords = this.getCoordsFromEl(el)
                        this.makeTurn(coords.row, coords.col)
                    }
                }

                // Click on Play button
                if (el.classList.contains(`play-btn`)) {
                    if (this.isGameFinished()) {
                        this.startNewGame()
                        this.renderApp()
                    }
                }
            })
        }
    }

    const main = () => {
        game.bindEventHandlers()
        game.startNewGame()
        game.renderApp()
    }

    main()
})()
