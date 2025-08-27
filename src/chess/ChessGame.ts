export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type Position = { row: number; col: number };

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  promotionPiece?: PieceType;
}

export class ChessGame {
  private board: (Piece | null)[][];
  private currentPlayer: PieceColor;
  private gameHistory: Move[];
  private enPassantTarget: Position | null;
  private isGameOver: boolean;
  private winner: PieceColor | 'draw' | null;

  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.gameHistory = [];
    this.enPassantTarget = null;
    this.isGameOver = false;
    this.winner = null;
  }

  private initializeBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: 'pawn', color: 'black' };
      board[6][col] = { type: 'pawn', color: 'white' };
    }
    
    // Set up other pieces
    const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: pieceOrder[col], color: 'black' };
      board[7][col] = { type: pieceOrder[col], color: 'white' };
    }
    
    return board;
  }

  getBoard(): (Piece | null)[][] {
    return this.board.map(row => [...row]);
  }

  getCurrentPlayer(): PieceColor {
    return this.currentPlayer;
  }

  getPiece(position: Position): Piece | null {
    return this.board[position.row][position.col];
  }

  isValidPosition(position: Position): boolean {
    return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
  }

  getPossibleMoves(from: Position): Position[] {
    const piece = this.getPiece(from);
    if (!piece || piece.color !== this.currentPlayer) {
      return [];
    }

    const moves = this.calculatePossibleMoves(from, piece, false);
    return moves.filter(to => !this.wouldBeInCheck(from, to));
  }

  private calculatePossibleMoves(from: Position, piece: Piece, forCheckValidation: boolean = false): Position[] {
    switch (piece.type) {
      case 'pawn':
        return this.getPawnMoves(from, piece.color);
      case 'rook':
        return this.getRookMoves(from);
      case 'knight':
        return this.getKnightMoves(from);
      case 'bishop':
        return this.getBishopMoves(from);
      case 'queen':
        return [...this.getRookMoves(from), ...this.getBishopMoves(from)];
      case 'king':
        return this.getKingMoves(from, forCheckValidation);
      default:
        return [];
    }
  }

  private getPawnMoves(from: Position, color: PieceColor): Position[] {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Forward move
    const oneStep = { row: from.row + direction, col: from.col };
    if (this.isValidPosition(oneStep) && !this.getPiece(oneStep)) {
      moves.push(oneStep);

      // Double move from starting position
      if (from.row === startRow) {
        const twoStep = { row: from.row + 2 * direction, col: from.col };
        if (this.isValidPosition(twoStep) && !this.getPiece(twoStep)) {
          moves.push(twoStep);
        }
      }
    }

    // Captures
    [-1, 1].forEach(colOffset => {
      const capturePos = { row: from.row + direction, col: from.col + colOffset };
      if (this.isValidPosition(capturePos)) {
        const targetPiece = this.getPiece(capturePos);
        if (targetPiece && targetPiece.color !== color) {
          moves.push(capturePos);
        }
        
        // En passant
        if (this.enPassantTarget && 
            capturePos.row === this.enPassantTarget.row && 
            capturePos.col === this.enPassantTarget.col) {
          moves.push(capturePos);
        }
      }
    });

    return moves;
  }

  private getRookMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    directions.forEach(([rowDir, colDir]) => {
      for (let i = 1; i < 8; i++) {
        const pos = { row: from.row + i * rowDir, col: from.col + i * colDir };
        if (!this.isValidPosition(pos)) break;

        const piece = this.getPiece(pos);
        if (!piece) {
          moves.push(pos);
        } else {
          if (piece.color !== this.getPiece(from)!.color) {
            moves.push(pos);
          }
          break;
        }
      }
    });

    return moves;
  }

  private getBishopMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    directions.forEach(([rowDir, colDir]) => {
      for (let i = 1; i < 8; i++) {
        const pos = { row: from.row + i * rowDir, col: from.col + i * colDir };
        if (!this.isValidPosition(pos)) break;

        const piece = this.getPiece(pos);
        if (!piece) {
          moves.push(pos);
        } else {
          if (piece.color !== this.getPiece(from)!.color) {
            moves.push(pos);
          }
          break;
        }
      }
    });

    return moves;
  }

  private getKnightMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    knightMoves.forEach(([rowOffset, colOffset]) => {
      const pos = { row: from.row + rowOffset, col: from.col + colOffset };
      if (this.isValidPosition(pos)) {
        const piece = this.getPiece(pos);
        if (!piece || piece.color !== this.getPiece(from)!.color) {
          moves.push(pos);
        }
      }
    });

    return moves;
  }

  private getKingMoves(from: Position, forCheckValidation: boolean = false): Position[] {
    const moves: Position[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([rowDir, colDir]) => {
      const pos = { row: from.row + rowDir, col: from.col + colDir };
      if (this.isValidPosition(pos)) {
        const piece = this.getPiece(pos);
        if (!piece || piece.color !== this.getPiece(from)!.color) {
          moves.push(pos);
        }
      }
    });

    // Castling
    if (!forCheckValidation) {
    const piece = this.getPiece(from)!;
    if (!piece.hasMoved && !this.isInCheck(piece.color)) {
      // King side castling
      const kingsideRook = this.getPiece({ row: from.row, col: 7 });
      if (kingsideRook && !kingsideRook.hasMoved) {
        if (!this.getPiece({ row: from.row, col: 5 }) && 
            !this.getPiece({ row: from.row, col: 6 })) {
          moves.push({ row: from.row, col: 6 });
        }
      }

      // Queen side castling
      const queensideRook = this.getPiece({ row: from.row, col: 0 });
      if (queensideRook && !queensideRook.hasMoved) {
        if (!this.getPiece({ row: from.row, col: 1 }) && 
            !this.getPiece({ row: from.row, col: 2 }) && 
            !this.getPiece({ row: from.row, col: 3 })) {
          moves.push({ row: from.row, col: 2 });
        }
      }
    }
    }

    return moves;
  }

  private wouldBeInCheck(from: Position, to: Position): boolean {
    // Simulate the move
    const originalPiece = this.getPiece(to);
    const movingPiece = this.getPiece(from)!;
    
    this.board[to.row][to.col] = movingPiece;
    this.board[from.row][from.col] = null;

    const inCheck = this.isInCheck(movingPiece.color);

    // Restore the board
    this.board[from.row][from.col] = movingPiece;
    this.board[to.row][to.col] = originalPiece;

    return inCheck;
  }

  private isInCheck(color: PieceColor): boolean {
    const king = this.findKing(color);
    if (!king) return false;

    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color !== color) {
          const moves = this.calculatePossibleMoves({ row, col }, piece, true);
          if (moves.some(move => move.row === king.row && move.col === king.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private findKing(color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  makeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
    if (this.isGameOver) return false;

    const piece = this.getPiece(from);
    if (!piece || piece.color !== this.currentPlayer) return false;

    const possibleMoves = this.getPossibleMoves(from);
    const isValidMove = possibleMoves.some(move => move.row === to.row && move.col === to.col);
    
    if (!isValidMove) return false;

    const move: Move = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: this.getPiece(to) ? { ...this.getPiece(to)! } : undefined
    };

    // Handle special moves
    this.handleSpecialMoves(move, promotionPiece);

    // Make the move
    this.board[to.row][to.col] = { ...piece, hasMoved: true };
    this.board[from.row][from.col] = null;

    // Update en passant target
    this.updateEnPassantTarget(move);

    this.gameHistory.push(move);
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Check for game over conditions
    this.checkGameEnd();

    return true;
  }

  private handleSpecialMoves(move: Move, promotionPiece?: PieceType): void {
    // Pawn promotion
    if (move.piece.type === 'pawn' && (move.to.row === 0 || move.to.row === 7)) {
      move.promotionPiece = promotionPiece || 'queen';
      move.piece.type = move.promotionPiece;
    }

    // Castling
    if (move.piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
      move.isCastling = true;
      const isKingside = move.to.col > move.from.col;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      
      // Move the rook
      const rook = this.board[move.from.row][rookFromCol];
      this.board[move.from.row][rookToCol] = rook;
      this.board[move.from.row][rookFromCol] = null;
    }

    // En passant
    if (move.piece.type === 'pawn' && 
        this.enPassantTarget && 
        move.to.row === this.enPassantTarget.row && 
        move.to.col === this.enPassantTarget.col) {
      move.isEnPassant = true;
      const capturedPawnRow = move.piece.color === 'white' ? move.to.row + 1 : move.to.row - 1;
      move.capturedPiece = this.board[capturedPawnRow][move.to.col];
      this.board[capturedPawnRow][move.to.col] = null;
    }
  }

  private updateEnPassantTarget(move: Move): void {
    this.enPassantTarget = null;
    
    if (move.piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
      this.enPassantTarget = {
        row: move.piece.color === 'white' ? move.to.row + 1 : move.to.row - 1,
        col: move.to.col
      };
    }
  }

  private checkGameEnd(): void {
    const hasValidMoves = this.hasValidMoves(this.currentPlayer);
    const inCheck = this.isInCheck(this.currentPlayer);

    if (!hasValidMoves) {
      this.isGameOver = true;
      if (inCheck) {
        this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
      } else {
        this.winner = 'draw'; // Stalemate
      }
    }
  }

  private hasValidMoves(color: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          if (this.getPossibleMoves({ row, col }).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isGameFinished(): boolean {
    return this.isGameOver;
  }

  getWinner(): PieceColor | 'draw' | null {
    return this.winner;
  }

  getGameHistory(): Move[] {
    return [...this.gameHistory];
  }

  reset(): void {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.gameHistory = [];
    this.enPassantTarget = null;
    this.isGameOver = false;
    this.winner = null;
  }
}