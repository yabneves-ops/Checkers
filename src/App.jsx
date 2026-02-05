import { useState } from 'react'
import './App.css'
import TicTacToe from './TicTacToe'
import Checkers from './Checkers'

function App() {
  const [game, setGame] = useState(null)

  return (
    <>
      <h1>Games</h1>
      <div className="card">
        {!game ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="launch" onClick={() => setGame('tic')}>
              Tic-Tac-Toe
            </button>
            <button className="launch" onClick={() => setGame('checkers')}>
              Checkers
            </button>
          </div>
        ) : game === 'tic' ? (
          <>
            <TicTacToe />
            <div style={{ marginTop: 8 }}>
              <button className="launch" onClick={() => setGame(null)}>Back</button>
            </div>
          </>
        ) : (
          <>
            <Checkers />
            <div style={{ marginTop: 8 }}>
              <button className="launch" onClick={() => setGame(null)}>Back</button>
            </div>
          </>
        )}
      </div>
      <p className="read-the-docs">Enjoy the game</p>
    </>
  )
}

export default App
