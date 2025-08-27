import React, { useRef, useEffect, useState } from 'react';
import { ChessGame } from '../chess/ChessGame';
import { ChessRenderer } from '../chess/ChessRenderer';
import { ChessAnimator } from '../chess/ChessAnimation';

interface ChessBoardProps {
  size?: number;
  onGameUpdate?: (game: ChessGame) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  size = 480, 
  onGameUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ChessGame>(new ChessGame());
  const rendererRef = useRef<ChessRenderer | null>(null);
  const animatorRef = useRef<ChessAnimator | null>(null);
  
  const [currentPlayer, setCurrentPlayer] = useState<string>('white');
  const [gameStatus, setGameStatus] = useState<string>('playing');

  const updateGameState = () => {
    const game = gameRef.current;
    setCurrentPlayer(game.getCurrentPlayer());
    
    if (game.isGameFinished()) {
      const winner = game.getWinner();
      if (winner === 'draw') {
        setGameStatus('Draw');
      } else {
        setGameStatus(`${winner} wins`);
      }
    } else {
      setGameStatus(`${game.getCurrentPlayer()}'s turn`);
    }
    
    onGameUpdate?.(game);
  };
  useEffect(() => {
    if (canvasRef.current && overlayCanvasRef.current) {
      rendererRef.current = new ChessRenderer(
        gameRef.current,
        canvasRef.current,
        overlayCanvasRef.current,
        {
          boardSize: size,
          lightSquareColor: '#F0D9B5',
          darkSquareColor: '#B58863',
          highlightColor: '#FFFF00',
          selectedColor: '#7DD3FC',
          moveHighlightColor: '#10B981'
        }
      );

      animatorRef.current = new ChessAnimator(rendererRef.current);
      
      // Initial game state update
      updateGameState();
      
      // Override the game's makeMove method to trigger updates
      const originalMakeMove = gameRef.current.makeMove.bind(gameRef.current);
      gameRef.current.makeMove = (from, to, promotionPiece) => {
        const result = originalMakeMove(from, to, promotionPiece);
        if (result) {
          updateGameState();
        }
        return result;
      };
    }
  }, [size, onGameUpdate]);

  const resetGame = () => {
    gameRef.current.reset();
    rendererRef.current?.render();
    setCurrentPlayer('white');
    setGameStatus("white's turn");
    updateGameState();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Chess Game</h2>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Game
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Current Player: 
              <span className={`ml-2 ${currentPlayer === 'white' ? 'text-gray-800' : 'text-gray-600'}`}>
                {currentPlayer}
              </span>
            </span>
            <span className="text-sm text-gray-600">
              {gameStatus}
            </span>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-inner"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-pointer"
            style={{ imageRendering: 'pixelated' }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• Click and drag pieces to move them</p>
          <p>• Green dots show possible moves</p>
          <p>• Blue highlight shows selected piece</p>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;