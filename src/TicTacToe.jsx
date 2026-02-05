import { useState } from 'react'

function Square({ value, onClick }) {
  const classes = `square${value ? ` ${value === 'X' ? 'x' : 'o'} filled` : ''}`
  return (
    <button className={classes} onClick={onClick}>
      {value}
    </button>
  )
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

export default function TicTacToe() {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)

  const winner = calculateWinner(squares)
  const status = winner ? `Winner: ${winner}` : `Next: ${xIsNext ? 'X' : 'O'}`

  function handleClick(i) {
    if (squares[i] || winner) return
    const next = squares.slice()
    next[i] = xIsNext ? 'X' : 'O'
    setSquares(next)
    setXIsNext(!xIsNext)
  }

  function resetGame() {
    setSquares(Array(9).fill(null))
    setXIsNext(true)
  }

  return (
    <div className="game">
      <div className="status">{status}</div>
      <div className="board">
        {squares.map((sq, i) => (
          <Square key={i} value={sq} onClick={() => handleClick(i)} />
        ))}
      </div>
      <button className="reset" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  )
}
