import { useState, useEffect, useCallback } from 'react';
import './App.css';

export interface MazeData {
  maze_id: string;
  grid: number[][];
  start: [number, number]; 
  exit: [number, number];  
}

export interface PlayerPos {
  x: number;
  y: number;
}

export interface ScoreEntry {
  id: number;
  player_name: string;
  moves: number;
  timestamp: string;
}

function App() {
  const [mazeData, setMazeData] = useState<MazeData | null>(null);
  const [playerPos, setPlayerPos] = useState<PlayerPos | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [moves, setMoves] = useState(0);
  
  // Phase 3: New States for Database
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const fetchMaze = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/generate-maze?width=21&height=21');
      const data: MazeData = await response.json();
      setMazeData(data);
      setPlayerPos({ x: data.start[1], y: data.start[0] }); 
      setHasWon(false);
      setMoves(0);
      setScoreSubmitted(false);
      setPlayerName("");
    } catch (error) {
      console.error("Failed to fetch maze:", error);
    }
  }, []);

  // Phase 3: Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
      setShowLeaderboard(true);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  // Phase 3: Submit Score
  const submitScore = async () => {
    if (!playerName.trim()) return;
    try {
      await fetch('http://127.0.0.1:8000/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName, moves: moves })
      });
      setScoreSubmitted(true);
      fetchLeaderboard(); // Show the updated leaderboard immediately
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initialLoad = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/generate-maze?width=21&height=21');
        const data: MazeData = await response.json();
        if (isMounted) {
          setMazeData(data);
          setPlayerPos({ x: data.start[1], y: data.start[0] }); 
        }
      } catch (error) {
        console.error("Failed to fetch maze:", error);
      }
    };
    initialLoad();
    return () => { isMounted = false; };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!mazeData || !playerPos || hasWon || showLeaderboard) return; // Disable movement if won or viewing leaderboard

    let { x, y } = playerPos;
    let moved = false;

    if (e.key === 'ArrowUp') { y -= 1; moved = true; }
    if (e.key === 'ArrowDown') { y += 1; moved = true; }
    if (e.key === 'ArrowLeft') { x -= 1; moved = true; }
    if (e.key === 'ArrowRight') { x += 1; moved = true; }

    if (
      moved &&
      y >= 0 && y < mazeData.grid.length &&
      x >= 0 && x < mazeData.grid[0].length &&
      mazeData.grid[y][x] === 0
    ) {
      setPlayerPos({ x, y });
      setMoves((prev) => prev + 1);

      if (y === mazeData.exit[0] && x === mazeData.exit[1]) {
        setHasWon(true);
      }
    }
  }, [mazeData, playerPos, hasWon, showLeaderboard]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!mazeData || !playerPos) return <div className="loading">Loading Map...</div>;

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <h1>Maze Game!</h1>
        <div className="stats">
          <span className="stat-pill">Moves: <strong>{moves}</strong></span>
          <button className="leaderboard-btn" onClick={fetchLeaderboard}>🏆 Leaderboard</button>
        </div>
      </div>
      
      {/* The Win Modal */}
      {hasWon && !showLeaderboard && (
        <div className="modal-overlay">
          <div className="win-modal">
            <h2>Level Cleared! 🚀</h2>
            <p>You escaped in <strong>{moves}</strong> moves.</p>
            
            {!scoreSubmitted ? (
              <div className="score-submission">
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="name-input"
                  maxLength={15}
                />
                <div className="modal-actions">
                  <button onClick={submitScore} className="play-btn primary" disabled={!playerName.trim()}>Submit Score</button>
                  <button onClick={fetchMaze} className="play-btn secondary">Skip</button>
                </div>
              </div>
            ) : (
              <div className="score-submission">
                <button onClick={fetchMaze} className="play-btn primary">Next Level</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* The Leaderboard Modal */}
      {showLeaderboard && (
        <div className="modal-overlay">
          <div className="leaderboard-modal">
            <h2>Hall of Fame 🏆</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Moves</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={3}>No scores yet! Be the first!</td></tr>
                ) : (
                  leaderboard.map((score, index) => (
                    <tr key={score.id}>
                      <td>#{index + 1}</td>
                      <td>{score.player_name}</td>
                      <td>{score.moves}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button onClick={() => setShowLeaderboard(false)} className="play-btn secondary">Close</button>
          </div>
        </div>
      )}

      <div className="maze-board">
        {mazeData.grid.map((row, y) => (
          <div key={`row-${y}`} className="maze-row">
            {row.map((cell, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isExit = mazeData.exit[0] === y && mazeData.exit[1] === x;
              
              const distance = Math.sqrt(Math.pow(playerPos.x - x, 2) + Math.pow(playerPos.y - y, 2));
              const isVisible = distance <= 4.5 || hasWon;
              
              let cellClass = 'cell ';
              if (!isVisible) cellClass += 'fog ';
              else if (cell === 1) cellClass += 'wall ';
              else cellClass += 'path ';

              if (isPlayer) cellClass += 'player ';
              else if (isExit && isVisible) cellClass += 'exit ';

              return <div key={`cell-${x}-${y}`} className={cellClass} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;