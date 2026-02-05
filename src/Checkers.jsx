import { useState, useEffect } from 'react'

function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null))
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { side: 'b', king: false }
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { side: 'r', king: false }
    }
  }
  return board
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8
}



function applyMove(board, sr, sc, r, c, capture) {
  const next = board.map((row) => row.slice())
  const piece = next[sr][sc]
  next[r][c] = piece
  next[sr][sc] = null

  // Check for promotion: red reaches top row (0), black reaches bottom row (7)
  if ((piece.side === 'r' && r === 0) || (piece.side === 'b' && r === 7)) {
    next[r][c] = { ...piece, king: true }
  }

  if (capture) {
    next[capture[0]][capture[1]] = null
  }
  return next
}

export default function Checkers() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState(null) // 'ai' or 'friend'
  const [difficulty, setDifficulty] = useState(null)
  const [board, setBoard] = useState(() => createInitialBoard())
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState([])
  const [turn, setTurn] = useState('r')
  const [lastMove, setLastMove] = useState(null)
  const [lastCaptured, setLastCaptured] = useState(null)

  useEffect(() => {
    // Only trigger when turn changes to black and in AI mode
    if (turn === 'b' && gameStarted && gameMode === 'ai') {
      const timer = setTimeout(() => {
        const allMoves = getAllMoves(board, 'b')
        console.log('AI moves available:', allMoves.length)
        
        if (allMoves.length === 0) {
          return
        }

        let chosen = null

        if (difficulty === 'easy') {
          chosen = allMoves[Math.floor(Math.random() * allMoves.length)]
        } else if (difficulty === 'medium') {
          const captures = allMoves.filter((m) => m[2][2] !== null)
          if (captures.length > 0) {
            chosen = captures[Math.floor(Math.random() * captures.length)]
          } else {
            chosen = allMoves[Math.floor(Math.random() * allMoves.length)]
          }
        } else if (difficulty === 'expert') {
          let bestScore = -Infinity
          let bestMove = null
          for (const move of allMoves) {
            const [sr, sc, [r, c, capture]] = move
            const next = applyMove(board, sr, sc, r, c, capture)
            let score = evaluateBoard(next)
            if (capture) score += 10
            if ((sr - r > 0)) score += 2
            if (score > bestScore) {
              bestScore = score
              bestMove = move
            }
          }
          chosen = bestMove
        }

        if (chosen) {
          // allow AI to perform multi-captures: process each capture with delay
          let currentMove = chosen
          let working = board.map((row) => row.slice())
          let captureCount = 0
          
          const executeNextCapture = () => {
            if (!currentMove) {
              // All captures done, update board and switch turn
              setBoard(working)
              setTurn('r')
              return
            }
            
            const [sr, sc, [r, c, capture]] = currentMove
            working = applyMove(working, sr, sc, r, c, capture)
            const last = { from: [sr, sc], to: [r, c] }
            const lastCap = capture
            
            setBoard(working)
            setLastMove(last)
            setLastCaptured(lastCap)
            captureCount++
            
            // if this move was a capture, check for further captures
            if (capture) {
              const rawFurther = computeMoves(working, r, c, true).filter(m => m[2] !== null)
              const further = rawFurther.map(mv => [r, c, mv])
              if (further.length > 0) {
                // pick one capture (expert prefers best, medium/random)
                if (difficulty === 'expert') {
                  let best = null
                  let bestScore = -Infinity
                  for (const mv of further) {
                    const [csr, csc, [cr, cc, ccapture]] = mv
                    const cand = applyMove(working, csr, csc, cr, cc, ccapture)
                    let score = evaluateBoard(cand)
                    if (score > bestScore) { bestScore = score; best = mv }
                  }
                  currentMove = best
                } else {
                  currentMove = further[Math.floor(Math.random() * further.length)]
                }
                // Schedule next capture after animation completes
                setTimeout(executeNextCapture, 900)
              } else {
                // No more captures, finish
                setTimeout(() => {
                  setLastMove(null)
                  setLastCaptured(null)
                  setTurn('r')
                }, 900)
              }
            } else {
              // Non-capture, shouldn't happen but handle it
              setTimeout(() => {
                setLastMove(null)
                setLastCaptured(null)
                setTurn('r')
              }, 900)
            }
          }
          
          executeNextCapture()
        }
      }, 400)
      
      return () => clearTimeout(timer)
    }
  }, [turn, gameStarted, gameMode])

  function getAllMoves(board, side) {
    const moves = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] && board[r][c].side === side) {
          const pieceMoves = computeMoves(board, r, c)
          for (const move of pieceMoves) {
            moves.push([r, c, move])
          }
        }
      }
    }
    return moves
  }

  function evaluateBoard(board) {
    let score = 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]) {
          const val = board[r][c].side === 'b' ? 1 : -1
          score += val
        }
      }
    }
    return score
  }

  function handleCellClick(r, c) {
    console.log('handleCellClick', r, c, 'turn', turn)
    // In friend mode, allow both players; in AI mode, only red (player)
    if (gameMode === 'ai' && turn !== 'r') return

    const cell = board[r][c]
    // if any capture exists for current player, they must capture with one of their pieces
    const capturingSide = gameMode === 'friend' ? turn : 'r'
    const allPlayerMoves = getAllMoves(board, capturingSide)
    const playerMustCapture = allPlayerMoves.some((m) => m[2] && m[2][2] !== null)
    if (selected) {
      const [sr, sc] = selected
      console.log('selected', sr, sc)
      if (sr === r && sc === c) {
        setSelected(null)
        setMoves([])
        return
      }

      const valid = moves.some(([mr, mc]) => mr === r && mc === c)
      console.log('valid?', valid, 'moves', moves)
      if (valid) {
        const moveObj = moves.find(([mr, mc]) => mr === r && mc === c)
        console.log('applying moveObj', moveObj)
        const next = applyMove(board, sr, sc, r, c, moveObj[2])
        // if capture, check for further captures for this piece (multi-jump)
        if (moveObj[2]) {
          const further = computeMoves(next, r, c, true).filter(m => m[2] !== null)
          setBoard(next)
          setLastMove({ from: [sr, sc], to: [r, c] })
          setLastCaptured(moveObj[2])
          if (further.length > 0) {
            // keep player's turn and select the moved piece for chained capture
            // Wait for animation to complete before allowing next move
            setTimeout(() => {
              setLastMove(null)
              setLastCaptured(null)
              setSelected([r, c])
              setMoves(further)
            }, 900)
            return
          }
          // Single capture, clear animation after delay
          setTimeout(() => { setLastMove(null); setLastCaptured(null) }, 900)
        }
        setBoard(next)
        // Switch turn
        setTurn(turn === 'r' ? 'b' : 'r')
        setSelected(null)
        setMoves([])
      } else if (cell && cell.side === capturingSide) {
        // selecting another piece: if captures exist, only allow selecting pieces that can capture
        let pieceMoves = computeMoves(board, r, c)
        if (playerMustCapture) pieceMoves = pieceMoves.filter(mv => mv[2] !== null)
        if (pieceMoves.length === 0) return
        setSelected([r, c])
        setMoves(pieceMoves)
      } else {
        setSelected(null)
        setMoves([])
      }
    } else {
      if (cell && cell.side === capturingSide) {
        console.log('selecting', r, c)
        let pieceMoves = computeMoves(board, r, c)
        if (playerMustCapture) pieceMoves = pieceMoves.filter(mv => mv[2] !== null)
        if (pieceMoves.length === 0) return
        setSelected([r, c])
        setMoves(pieceMoves)
      }
    }
  }

  function computeMoves(board, r, c, allowBackwardCapture = false) {
    const piece = board[r][c]
    if (!piece) return []
    console.log('computeMoves for', r, c, piece, 'allowBack', allowBackwardCapture)
    const isKing = piece.king === true
    const res = []

    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

    if (!isKing) {
      // simple forward moves (non-king)
      const forwardDirs = piece.side === 'r' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
      for (const [dr, dc] of forwardDirs) {
        const nr = r + dr
        const nc = c + dc
        if (inBounds(nr, nc) && !board[nr][nc]) {
          res.push([nr, nc, null])
        }
      }

      // captures: allow captures in any diagonal when allowBackwardCapture true,
      // otherwise only forward captures
      const captureDirs = allowBackwardCapture ? directions : forwardDirs
      for (const [dr, dc] of captureDirs) {
        const nr = r + dr
        const nc = c + dc
        if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc].side !== piece.side) {
          const jr = nr + dr
          const jc = nc + dc
          if (inBounds(jr, jc) && !board[jr][jc]) res.push([jr, jc, [nr, nc]])
        }
      }
    } else {
      // King: can move any distance diagonally (like bishop)
      for (const [dr, dc] of directions) {
        let nr = r + dr
        let nc = c + dc
        // simple non-capture moves along empty squares
        while (inBounds(nr, nc) && !board[nr][nc]) {
          res.push([nr, nc, null])
          nr += dr
          nc += dc
        }
        // if we hit an opponent piece, we can capture and land on any empty square beyond it
        if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc].side !== piece.side) {
          let jr = nr + dr
          let jc = nc + dc
          while (inBounds(jr, jc)) {
            if (!board[jr][jc]) {
              res.push([jr, jc, [nr, nc]])
              jr += dr
              jc += dc
            } else break
          }
        }
      }
    }

    console.log('moves result', res)
    return res
  }
  function reset() {
    setBoard(createInitialBoard())
    setTurn('r')
    setSelected(null)
    setMoves([])
    setLastMove(null)
    setLastCaptured(null)
    setGameStarted(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setGameMode('ai')}
            style={{ fontWeight: gameMode === 'ai' ? 'bold' : 'normal' }}
          >
            vs AI
          </button>
          <button
            onClick={() => setGameMode('friend')}
            style={{ fontWeight: gameMode === 'friend' ? 'bold' : 'normal' }}
          >
            Play with Friend
          </button>
        </div>

        {gameMode === 'ai' && (
          <select
            value={difficulty || ''}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ padding: '6px 8px' }}
          >
            <option value="">Select difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="expert">Expert</option>
          </select>
        )}

        {gameMode && (
          <button
            onClick={() => {
              if (gameMode === 'ai' && !difficulty) setDifficulty('easy')
              reset()
            }}
          >
            Start Game
          </button>
        )}
      </div>

      <div className="checkers-board">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const dark = (r + c) % 2 === 1
            const isSelected = selected && selected[0] === r && selected[1] === c
            const movedHere = lastMove && lastMove.to[0] === r && lastMove.to[1] === c
            const capturedHere = lastCaptured && lastCaptured[0] === r && lastCaptured[1] === c
            const isPossibleMove = moves.some(([mr, mc]) => mr === r && mc === c)
            const isCaptureDash = movedHere && lastCaptured
            return (
              <div
                key={`${r}-${c}`}
                className={`cell ${dark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${movedHere ? 'moved' : ''} ${capturedHere ? 'captured' : ''} ${isPossibleMove ? 'possible' : ''} ${isCaptureDash ? 'capture-dash' : ''}`}
                onClick={() => handleCellClick(r, c)}
              >
                {cell && (
                  <div className={`piece ${cell.side === 'r' ? 'red' : 'black'} ${cell.king ? 'king' : ''}`}>
                    {cell.king && '♛'}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="reset" onClick={reset}>
          New Game
        </button>
      </div>
    </div>
  )
}
