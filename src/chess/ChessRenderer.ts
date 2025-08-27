import { ChessGame, Piece, PieceColor, PieceType, Position } from './ChessGame';

export interface RendererOptions {
  boardSize: number;
  lightSquareColor: string;
  darkSquareColor: string;
  highlightColor: string;
  selectedColor: string;
  moveHighlightColor: string;
}

export class ChessRenderer {
  private game: ChessGame;
  private canvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlayCtx: CanvasRenderingContext2D;
  private options: RendererOptions;
  private squareSize: number;
  private pieceSpritesheet: HTMLImageElement | null = null;
  private selectedSquare: Position | null = null;
  private highlightedSquares: Position[] = [];
  private dragState: {
    piece: Piece;
    from: Position;
    offset: { x: number; y: number };
    currentPos: { x: number; y: number };
  } | null = null;

  constructor(
    game: ChessGame, 
    canvas: HTMLCanvasElement, 
    overlayCanvas: HTMLCanvasElement,
    options: Partial<RendererOptions> = {}
  ) {
    this.game = game;
    this.canvas = canvas;
    this.overlayCanvas = overlayCanvas;
    this.ctx = canvas.getContext('2d')!;
    this.overlayCtx = overlayCanvas.getContext('2d')!;
    
    this.options = {
      boardSize: 480,
      lightSquareColor: '#F0D9B5',
      darkSquareColor: '#B58863',
      highlightColor: '#FFFF00',
      selectedColor: '#7DD3FC',
      moveHighlightColor: '#10B981',
      ...options
    };

    this.squareSize = this.options.boardSize / 8;
    this.setupCanvas();
    this.loadPieceSpritesheet();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    const size = this.options.boardSize;
    
    // Setup main canvas
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    // Setup overlay canvas
    this.overlayCanvas.width = size;
    this.overlayCanvas.height = size;
    this.overlayCanvas.style.width = `${size}px`;
    this.overlayCanvas.style.height = `${size}px`;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
  }

  private async loadPieceSpritesheet(): Promise<void> {
    return new Promise((resolve) => {
      this.pieceSpritesheet = new Image();
      this.pieceSpritesheet.onload = () => {
        this.render();
        resolve();
      };
      // Create SVG spritesheet programmatically
      this.createPieceSpritesheet();
    });
  }

  private createPieceSpritesheet(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 384; // 6 pieces * 64px
    canvas.height = 128; // 2 colors * 64px
    const ctx = canvas.getContext('2d')!;

    const pieces = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
    const colors = ['white', 'black'];

    colors.forEach((color, colorIndex) => {
      pieces.forEach((piece, pieceIndex) => {
        const svg = this.createPieceSVG(piece as PieceType, color as PieceColor);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, pieceIndex * 64, colorIndex * 64, 64, 64);
          
          // Check if this is the last piece
          if (colorIndex === 1 && pieceIndex === 5) {
            canvas.toBlob((blob) => {
              if (blob) {
                this.pieceSpritesheet!.src = URL.createObjectURL(blob);
              }
            });
          }
        };
        img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      });
    });
  }

  private createPieceSVG(type: PieceType, color: PieceColor): string {
    const fill = color === 'white' ? '#FFFFFF' : '#000000';
    const stroke = color === 'white' ? '#000000' : '#FFFFFF';
    
    const svgs = {
      king: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8 L28 12 L36 12 Z M24 16 L40 16 L38 20 L26 20 Z M22 24 L42 24 L40 48 L24 48 Z M20 52 L44 52 L44 56 L20 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        <circle cx="32" cy="6" r="2" fill="${fill}" stroke="${stroke}"/>
      </svg>`,
      
      queen: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 20 L20 12 L24 18 L28 8 L32 16 L36 8 L40 18 L44 12 L48 20 L44 48 L20 48 Z M18 52 L46 52 L46 56 L18 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        <circle cx="20" cy="10" r="2" fill="${fill}"/>
        <circle cx="32" cy="6" r="2" fill="${fill}"/>
        <circle cx="44" cy="10" r="2" fill="${fill}"/>
      </svg>`,
      
      rook: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 12 L20 8 L24 8 L24 12 L28 12 L28 8 L36 8 L36 12 L40 12 L40 8 L44 8 L44 12 L44 16 L40 20 L40 48 L24 48 L24 20 L20 16 Z M22 52 L42 52 L42 56 L22 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
      </svg>`,
      
      bishop: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8 L28 12 L26 16 L26 20 L24 24 L24 48 L40 48 L40 24 L38 20 L38 16 L36 12 Z M22 52 L42 52 L42 56 L22 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        <circle cx="32" cy="6" r="3" fill="${fill}" stroke="${stroke}"/>
      </svg>`,
      
      knight: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12 Q28 8 32 12 Q36 8 40 16 Q42 20 38 28 Q36 32 40 36 L40 48 L24 48 L24 36 Q20 32 22 24 Q24 16 24 12 Z M22 52 L42 52 L42 56 L22 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
      </svg>`,
      
      pawn: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="16" r="6" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        <path d="M28 24 L36 24 L38 48 L26 48 Z M24 52 L40 52 L40 56 L24 56 Z" 
              fill="${fill}" stroke="${stroke}" stroke-width="1"/>
      </svg>`
    };
    
    return svgs[type];
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getSquareFromPixel(x: number, y: number): Position {
    return {
      row: Math.floor(y / this.squareSize),
      col: Math.floor(x / this.squareSize)
    };
  }

  private getPixelFromSquare(position: Position): { x: number; y: number } {
    return {
      x: position.col * this.squareSize,
      y: position.row * this.squareSize
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const square = this.getSquareFromPixel(x, y);
    
    const piece = this.game.getPiece(square);
    
    if (piece && piece.color === this.game.getCurrentPlayer()) {
      this.selectedSquare = square;
      this.highlightedSquares = this.game.getPossibleMoves(square);
      
      // Start dragging
      this.dragState = {
        piece,
        from: square,
        offset: {
          x: x - (square.col * this.squareSize),
          y: y - (square.row * this.squareSize)
        },
        currentPos: { x, y }
      };
      
      this.render();
    } else {
      this.selectedSquare = null;
      this.highlightedSquares = [];
      this.render();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.dragState) {
      const rect = this.canvas.getBoundingClientRect();
      this.dragState.currentPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      this.render();
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.dragState) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const targetSquare = this.getSquareFromPixel(x, y);
      
      // Try to make the move
      this.game.makeMove(this.dragState.from, targetSquare);
      
      this.dragState = null;
      this.selectedSquare = null;
      this.highlightedSquares = [];
      this.render();
    }
  }

  public render(): void {
    this.renderBoard();
    this.renderPieces();
    this.renderOverlay();
  }

  private renderBoard(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        this.ctx.fillStyle = isLight ? this.options.lightSquareColor : this.options.darkSquareColor;
        
        const x = col * this.squareSize;
        const y = row * this.squareSize;
        this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
      }
    }
  }

  private renderPieces(): void {
    if (!this.pieceSpritesheet) return;
    
    const board = this.game.getBoard();
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        
        // Skip the piece being dragged
        if (this.dragState && 
            this.dragState.from.row === row && 
            this.dragState.from.col === col) {
          continue;
        }
        
        if (piece) {
          this.renderPiece(piece, { row, col });
        }
      }
    }
    
    // Render dragged piece
    if (this.dragState) {
      const x = this.dragState.currentPos.x - this.dragState.offset.x;
      const y = this.dragState.currentPos.y - this.dragState.offset.y;
      
      this.ctx.save();
      this.ctx.globalAlpha = 0.8;
      this.renderPieceAt(this.dragState.piece, x, y);
      this.ctx.restore();
    }
  }

  private renderPiece(piece: Piece, position: Position): void {
    const pixel = this.getPixelFromSquare(position);
    this.renderPieceAt(piece, pixel.x, pixel.y);
  }

  private renderPieceAt(piece: Piece, x: number, y: number): void {
    if (!this.pieceSpritesheet) return;
    
    const pieceOrder = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
    const pieceIndex = pieceOrder.indexOf(piece.type);
    const colorIndex = piece.color === 'white' ? 0 : 1;
    
    const sourceX = pieceIndex * 64;
    const sourceY = colorIndex * 64;
    
    this.ctx.drawImage(
      this.pieceSpritesheet,
      sourceX, sourceY, 64, 64,
      x, y, this.squareSize, this.squareSize
    );
  }

  private renderOverlay(): void {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    
    // Highlight selected square
    if (this.selectedSquare) {
      this.highlightSquare(this.selectedSquare, this.options.selectedColor, 0.5);
    }
    
    // Highlight possible moves
    this.highlightedSquares.forEach(square => {
      this.highlightSquare(square, this.options.moveHighlightColor, 0.3);
      
      // Draw move indicators
      const pixel = this.getPixelFromSquare(square);
      const centerX = pixel.x + this.squareSize / 2;
      const centerY = pixel.y + this.squareSize / 2;
      
      this.overlayCtx.fillStyle = this.options.moveHighlightColor;
      this.overlayCtx.beginPath();
      this.overlayCtx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      this.overlayCtx.fill();
    });
  }

  private highlightSquare(position: Position, color: string, alpha: number): void {
    this.overlayCtx.save();
    this.overlayCtx.globalAlpha = alpha;
    this.overlayCtx.fillStyle = color;
    
    const pixel = this.getPixelFromSquare(position);
    this.overlayCtx.fillRect(pixel.x, pixel.y, this.squareSize, this.squareSize);
    
    this.overlayCtx.restore();
  }

  public updateGame(game: ChessGame): void {
    this.game = game;
    this.render();
  }

  public resize(newSize: number): void {
    this.options.boardSize = newSize;
    this.squareSize = newSize / 8;
    this.setupCanvas();
    this.render();
  }
}