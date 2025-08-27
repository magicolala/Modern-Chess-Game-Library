import React, { useState } from 'react';
import ChessBoard from './components/ChessBoard';
import { ChessGame } from './chess/ChessGame';
import { Crown, RotateCcw, Users } from 'lucide-react';

function App() {
  const [game, setGame] = useState<ChessGame | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const handleGameUpdate = (updatedGame: ChessGame) => {
    setGame(updatedGame);
    
    // Update move history
    const history = updatedGame.getGameHistory();
    const formattedHistory = history.map((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhiteMove = index % 2 === 0;
      const algebraicMove = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row} → ${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`;
      
      return isWhiteMove 
        ? `${moveNumber}. ${algebraicMove}` 
        : algebraicMove;
    });
    
    setMoveHistory(formattedHistory);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-10 w-10 text-amber-600" />
            <h1 className="text-4xl font-bold text-gray-800">Modern Chess</h1>
          </div>
          <p className="text-lg text-gray-600">
            A complete chess implementation with smooth animations and modern design
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Chess Board */}
          <div className="flex-shrink-0">
            <ChessBoard 
              size={480}
              onGameUpdate={handleGameUpdate}
            />
          </div>

          {/* Game Info Panel */}
          <div className="w-full lg:w-80 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">Game Info</h3>
            </div>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  game?.isGameFinished() 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {game?.isGameFinished() 
                    ? (game.getWinner() === 'draw' ? 'Draw' : `${game.getWinner()} Wins`)
                    : `${game?.getCurrentPlayer() || 'White'}'s Turn`
                  }
                </span>
              </div>
            </div>

            {/* Move History */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold text-gray-700">Move History</h4>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                {moveHistory.length > 0 ? (
                  <div className="space-y-1">
                    {moveHistory.map((move, index) => (
                      <div 
                        key={index}
                        className={`text-sm p-2 rounded ${
                          index % 4 < 2 ? 'bg-white' : 'bg-gray-100'
                        }`}
                      >
                        <span className="font-mono">{move}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No moves yet</p>
                )}
              </div>
            </div>

            {/* Game Statistics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-blue-800">
                    {Math.floor((moveHistory.length + 1) / 2)}
                  </div>
                  <div className="text-blue-600">Moves</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-purple-800">
                    {game?.getGameHistory().filter(m => m.capturedPiece).length || 0}
                  </div>
                  <div className="text-purple-600">Captures</div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">How to Play</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click and drag pieces to move</li>
                <li>• Green dots show valid moves</li>
                <li>• Blue highlight shows selection</li>
                <li>• All chess rules implemented</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Complete Chess Logic</h4>
              <p className="text-gray-600 text-sm">
                Full implementation of chess rules including castling, en passant, and pawn promotion
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Smooth Animations</h4>
              <p className="text-gray-600 text-sm">
                60fps animations with Canvas rendering for fluid gameplay experience
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Modern Interface</h4>
              <p className="text-gray-600 text-sm">
                Clean, responsive design with intuitive drag-and-drop controls
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;