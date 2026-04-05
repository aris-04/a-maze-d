import random
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ==========================================
# 1. DATABASE SETUP (SQLAlchemy)
# ==========================================
DATABASE_URL = "sqlite:///./maze_scores.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String)
    moves = Column(Integer)
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

# This line is what actually creates the maze_scores.db file!
Base.metadata.create_all(bind=engine)


# ==========================================
# 2. FASTAPI APP & CORS SETUP
# ==========================================
app = FastAPI(title="Maze Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. PYDANTIC SCHEMAS (Data Validation)
# ==========================================
class ScoreCreate(BaseModel):
    player_name: str
    moves: int


# ==========================================
# 4. MAZE GENERATION LOGIC
# ==========================================
def generate_recursive_backtrack(width: int, height: int) -> List[List[int]]:
    grid = [[1 for _ in range(width)] for _ in range(height)]

    def walk(x: int, y: int):
        grid[y][x] = 0
        directions = [(0, 2), (0, -2), (2, 0), (-2, 0)]
        random.shuffle(directions)

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and grid[ny][nx] == 1:
                grid[y + dy // 2][x + dx // 2] = 0
                walk(nx, ny)

    walk(1, 1)
    grid[1][1] = 0
    grid[height - 2][width - 2] = 0
    return grid


# ==========================================
# 5. API ENDPOINTS (Routes)
# ==========================================
@app.get("/generate-maze")
def get_maze(width: int = 21, height: int = 21) -> Dict[str, Any]:
    w = width if width % 2 != 0 else width + 1
    h = height if height % 2 != 0 else height + 1
    maze = generate_recursive_backtrack(w, h)
    
    return {
        "maze_id": f"maze_{random.randint(1000, 9999)}",
        "grid": maze,
        "start": [1, 1],
        "exit": [h - 2, w - 2]
    }

@app.post("/save-score")
def save_score(score_data: ScoreCreate):
    db = SessionLocal()
    new_score = Score(player_name=score_data.player_name, moves=score_data.moves)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    db.close()
    return {"status": "success", "score_id": new_score.id}

@app.get("/leaderboard")
def get_leaderboard():
    db = SessionLocal()
    top_scores = db.query(Score).order_by(Score.moves.asc()).limit(10).all()
    db.close()
    return top_scores