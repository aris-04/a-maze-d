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