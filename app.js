/**
 * ============================================================================
 * Échecs Classiques - Application Principale (app.js)
 * Architecture Vanilla JS ES6+ - Règles FIDE & Moteur IA MiniMax
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constantes & Configurations
  // --------------------------------------------------------------------------
  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Tables Positionnelles (PeSTO / Simplified Evaluation Function)
  const PST = {
    p: [
      0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ],
    n: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ],
    b: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ],
    r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
    ],
    q: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ],
    k: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ]
  };

  const THEMES = ['theme-classic', 'theme-wood', 'theme-slate'];

  // --------------------------------------------------------------------------
  // 2. Gestionnaire Audio Web (Synthèse pure sans dépendances externes)
  // --------------------------------------------------------------------------
  class ChessAudio {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    initCtx() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playMove() {
      // Bruit doux de tapotement de pièce en bois
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playCapture() {
      // Son sec de prise
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playCheck() {
      // Double carillon d'alerte
      this.playTone(520, 0.12, 'sine', 0.2);
      setTimeout(() => this.playTone(680, 0.22, 'sine', 0.25), 110);
    }

    playGameOver() {
      // Triade majeure victorieuse
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.4, 'triangle', 0.2), i * 130);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. Moteur IA MiniMax avec Élagage Alpha-Bêta
  // --------------------------------------------------------------------------
  class ChessAI {
    constructor() {
      this.depth = 2;
    }

    // Évaluation heuristique du plateau
    evaluate(game) {
      if (game.in_checkmate()) {
        return game.turn() === 'w' ? -99999 : 99999;
      }
      if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
        return 0;
      }

      let score = 0;
      const board = game.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece) continue;

          const pVal = PIECE_VALUES[piece.type];
          const table = PST[piece.type];
          let posVal = 0;

          if (table) {
            const idx = piece.color === 'w' ? (r * 8 + c) : ((7 - r) * 8 + c);
            posVal = table[idx] || 0;
          }

          const total = pVal + posVal;
          if (piece.color === 'w') {
            score += total;
          } else {
            score -= total;
          }
        }
      }
      return score;
    }

    // Tri des coups (Move Ordering) pour maximiser les coupures alpha-bêta
    orderMoves(moves) {
      return moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.captured) {
          scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
        }
        if (a.promotion) scoreA += 800;
        if (b.captured) {
          scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
        }
        if (b.promotion) scoreB += 800;
        return scoreB - scoreA;
      });
    }

    minimax(game, depth, alpha, beta, isMaximizing) {
      if (depth === 0 || game.game_over()) {
        return this.evaluate(game);
      }

      const rawMoves = game.moves({ verbose: true });
      const moves = this.orderMoves(rawMoves);

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < moves.length; i++) {
          game.move(moves[i]);
          const evalScore = this.minimax(game, depth - 1, alpha, beta, false);
          game.undo();
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break; // Coupure Beta
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (let i = 0; i < moves.length; i++) {
          game.move(moves[i]);
          const evalScore = this.minimax(game, depth - 1, alpha, beta, true);
          game.undo();
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break; // Coupure Alpha
        }
        return minEval;
      }
    }

    // Sélection du meilleur coup
    getBestMove(game, depth = 2) {
      const rawMoves = game.moves({ verbose: true });
      if (movesCount(rawMoves) === 0) return null;

      // Niveau 1 (Débutant) : Choix simple et rapide
      if (depth === 1) {
        // Priorité aux captures si existantes, sinon coup aléatoire
        const captures = rawMoves.filter(m => m.captured);
        if (captures.length > 0 && Math.random() < 0.6) {
          return captures[Math.floor(Math.random() * captures.length)];
        }
        return rawMoves[Math.floor(Math.random() * rawMoves.length)];
      }

      const isMaximizing = (game.turn() === 'w');
      let bestMove = null;
      let bestValue = isMaximizing ? -Infinity : Infinity;

      const orderedMoves = this.orderMoves(rawMoves);

      for (let i = 0; i < orderedMoves.length; i++) {
        const move = orderedMoves[i];
        game.move(move);
        const value = this.minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
        game.undo();

        if (isMaximizing) {
          if (value > bestValue) {
            bestValue = value;
            bestMove = move;
          }
        } else {
          if (value < bestValue) {
            bestValue = value;
            bestMove = move;
          }
        }
      }

      return bestMove || orderedMoves[0];
    }
  }

  function movesCount(arr) {
    return arr ? arr.length : 0;
  }

  // --------------------------------------------------------------------------
  // 4. Contrôleur Principal du Jeu
  // --------------------------------------------------------------------------
  class ChessApp {
    constructor() {
      this.game = new window.Chess();
      this.ai = new ChessAI();
      this.audio = new ChessAudio();

      this.mode = 'ai'; // 'ai' ou 'pvp'
      this.aiDifficulty = 2;
      this.aiColor = 'b'; // L'humain joue 'w', l'IA joue 'b'
      this.isFlipped = false;
      this.themeIndex = 0;

      this.selectedSquare = null;
      this.legalMovesFromSquare = [];
      this.lastMove = null;
      this.pendingPromotion = null;
      this.isAiThinking = false;

      // Cache DOM
      this.dom = {
        board: document.getElementById('chessboard'),
        coordsRank: document.getElementById('coords-rank-left'),
        coordsFile: document.getElementById('coords-file-bottom'),
        playerTop: document.getElementById('player-top'),
        playerBottom: document.getElementById('player-bottom'),
        nameTop: document.getElementById('name-top'),
        subTop: document.getElementById('sub-top'),
        avatarTop: document.getElementById('avatar-top'),
        capturedTop: document.getElementById('captured-top-pieces'),
        advTop: document.getElementById('adv-top'),
        nameBottom: document.getElementById('name-bottom'),
        subBottom: document.getElementById('sub-bottom'),
        avatarBottom: document.getElementById('avatar-bottom'),
        capturedBottom: document.getElementById('captured-bottom-pieces'),
        advBottom: document.getElementById('adv-bottom'),
        statusBanner: document.getElementById('game-status-banner'),
        historyTbody: document.getElementById('history-tbody'),
        historyEmpty: document.getElementById('history-empty'),
        historyWrapper: document.getElementById('history-container'),
        moveCounter: document.getElementById('move-counter'),
        btnNewGame: document.getElementById('btn-new-game'),
        btnUndo: document.getElementById('btn-undo'),
        btnFlip: document.getElementById('btn-flip'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnTheme: document.getElementById('btn-theme'),
        btnRules: document.getElementById('btn-rules'),
        btnRulesClose: document.getElementById('btn-rules-close'),
        modeAiBtn: document.getElementById('mode-ai-btn'),
        modePvpBtn: document.getElementById('mode-pvp-btn'),
        aiOptions: document.getElementById('ai-options'),
        aiDifficultySelect: document.getElementById('ai-difficulty'),
        aiSideSelect: document.getElementById('ai-side'),
        modalPromotion: document.getElementById('modal-promotion'),
        promotionChoices: document.getElementById('promotion-choices'),
        modalGameOver: document.getElementById('modal-gameover'),
        gameOverTitle: document.getElementById('gameover-title'),
        gameOverDesc: document.getElementById('gameover-desc'),
        gameOverStats: document.getElementById('gameover-stats'),
        gameOverIcon: document.getElementById('gameover-icon'),
        btnGameOverRestart: document.getElementById('btn-gameover-restart'),
        btnGameOverClose: document.getElementById('btn-gameover-close'),
        modalRules: document.getElementById('modal-rules')
      };

      this.init();
    }

    init() {
      this.bindEvents();
      this.buildBoard();
      this.render();

      // Si l'IA commence (humain avec les Noirs en mode IA)
      if (this.mode === 'ai' && this.aiColor === 'w') {
        this.triggerAiMove();
      }
    }

    // ------------------------------------------------------------------------
    // Construction et Rendu de l'échiquier
    // ------------------------------------------------------------------------
    buildBoard() {
      this.dom.board.innerHTML = '';
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

      const displayRanks = this.isFlipped ? [...ranks].reverse() : ranks;
      const displayFiles = this.isFlipped ? [...files].reverse() : files;

      // Coordonnées Ranks (Verticales)
      this.dom.coordsRank.innerHTML = '';
      displayRanks.forEach(r => {
        const span = document.createElement('span');
        span.textContent = r;
        this.dom.coordsRank.appendChild(span);
      });

      // Coordonnées Files (Horizontales)
      this.dom.coordsFile.innerHTML = '';
      displayFiles.forEach(f => {
        const span = document.createElement('span');
        span.textContent = f.toUpperCase();
        this.dom.coordsFile.appendChild(span);
      });

      // Création des 64 cases
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const rank = displayRanks[r];
          const file = displayFiles[c];
          const squareName = file + rank;

          const squareEl = document.createElement('div');
          squareEl.className = 'square';
          squareEl.dataset.square = squareName;

          // Déterminer la couleur de la case
          const fileIdx = files.indexOf(file);
          const rankIdx = parseInt(rank, 10);
          const isLight = (fileIdx + rankIdx) % 2 !== 0;
          squareEl.classList.add(isLight ? 'light' : 'dark');

          // Écouteurs de clics et drag & drop
          squareEl.addEventListener('click', (e) => this.handleSquareClick(squareName, e));
          squareEl.addEventListener('dragover', (e) => this.handleDragOver(e));
          squareEl.addEventListener('drop', (e) => this.handleDrop(squareName, e));

          this.dom.board.appendChild(squareEl);
        }
      }
    }

    render() {
      const board = this.game.board(); // 8x8 de 8 à 1 et a à h
      const kingSquareInCheck = this.game.in_check() ? this.getKingSquare(this.game.turn()) : null;

      // Parcourir toutes les cases du DOM
      const squares = this.dom.board.querySelectorAll('.square');
      squares.forEach(sq => {
        const sqName = sq.dataset.square;
        sq.innerHTML = '';
        sq.className = 'square ' + (sq.classList.contains('light') ? 'light' : 'dark');

        // Surbrillance du dernier coup
        if (this.lastMove && (sqName === this.lastMove.from || sqName === this.lastMove.to)) {
          sq.classList.add('last-move');
        }

        // Surbrillance case sélectionnée
        if (this.selectedSquare === sqName) {
          sq.classList.add('selected');
        }

        // Indicateur d'Échec au Roi
        if (kingSquareInCheck === sqName) {
          sq.classList.add('in-check');
        }

        // Surbrillance des coups possibles
        const legalMove = this.legalMovesFromSquare.find(m => m.to === sqName);
        if (legalMove) {
          if (legalMove.captured || (legalMove.flags && legalMove.flags.includes('c'))) {
            sq.classList.add('hint-capture');
          } else {
            sq.classList.add('hint-move');
          }
        }

        // Placer la pièce s'il y en a une
        const piece = this.game.get(sqName);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          pieceEl.dataset.piece = piece.color + piece.type;
          pieceEl.dataset.square = sqName;
          pieceEl.draggable = true;

          const svgKey = piece.color + piece.type.toUpperCase();
          if (window.CHESS_PIECES && window.CHESS_PIECES[svgKey]) {
            pieceEl.innerHTML = window.CHESS_PIECES[svgKey];
          }

          // Événements Drag & Drop
          pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(sqName, e));
          pieceEl.addEventListener('dragend', () => this.handleDragEnd());

          sq.appendChild(pieceEl);
        }
      });

      this.updateStatusAndUI();
    }

    getKingSquare(color) {
      const board = this.game.board();
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === 'k' && p.color === color) {
            return files[c] + (8 - r);
          }
        }
      }
      return null;
    }

    // ------------------------------------------------------------------------
    // Gestion des interactions utilisateur
    // ------------------------------------------------------------------------
    handleSquareClick(squareName, event) {
      if (this.isAiThinking || this.game.game_over()) return;

      const currentTurn = this.game.turn();
      const isPlayerTurn = (this.mode === 'pvp') || (currentTurn !== this.aiColor);
      if (!isPlayerTurn) return;

      const clickedPiece = this.game.get(squareName);

      // Si une case est déjà sélectionnée
      if (this.selectedSquare) {
        // Tenter de jouer le coup
        const legalMove = this.legalMovesFromSquare.find(m => m.to === squareName);
        if (legalMove) {
          this.executeMoveWithPromotionCheck(this.selectedSquare, squareName);
          this.clearSelection();
          return;
        }

        // Clic sur une autre pièce de sa propre couleur : changer de sélection
        if (clickedPiece && clickedPiece.color === currentTurn) {
          this.selectSquare(squareName);
          return;
        }

        // Clic ailleurs : désélectionner
        this.clearSelection();
      } else {
        // Sélectionner la pièce si elle appartient au joueur actif
        if (clickedPiece && clickedPiece.color === currentTurn) {
          this.selectSquare(squareName);
        }
      }
    }

    selectSquare(squareName) {
      this.selectedSquare = squareName;
      this.legalMovesFromSquare = this.game.moves({
        square: squareName,
        verbose: true
      });
      this.render();
    }

    clearSelection() {
      this.selectedSquare = null;
      this.legalMovesFromSquare = [];
      this.render();
    }

    // Drag and drop
    handleDragStart(squareName, event) {
      if (this.isAiThinking || this.game.game_over()) {
        event.preventDefault();
        return;
      }
      const currentTurn = this.game.turn();
      const isPlayerTurn = (this.mode === 'pvp') || (currentTurn !== this.aiColor);
      const piece = this.game.get(squareName);

      if (!isPlayerTurn || !piece || piece.color !== currentTurn) {
        event.preventDefault();
        return;
      }

      this.selectedSquare = squareName;
      this.legalMovesFromSquare = this.game.moves({
        square: squareName,
        verbose: true
      });

      event.dataTransfer.setData('text/plain', squareName);
      event.dataTransfer.effectAllowed = 'move';
      event.target.classList.add('dragging');
      this.render();
    }

    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    handleDrop(targetSquare, event) {
      event.preventDefault();
      const fromSquare = event.dataTransfer.getData('text/plain');
      if (!fromSquare || fromSquare === targetSquare) {
        this.clearSelection();
        return;
      }

      const legalMove = this.legalMovesFromSquare.find(m => m.to === targetSquare);
      if (legalMove) {
        this.executeMoveWithPromotionCheck(fromSquare, targetSquare);
      }
      this.clearSelection();
    }

    handleDragEnd() {
      const dragging = document.querySelector('.piece.dragging');
      if (dragging) dragging.classList.remove('dragging');
    }

    // ------------------------------------------------------------------------
    // Exécution des Coups & Promotion de pion
    // ------------------------------------------------------------------------
    executeMoveWithPromotionCheck(from, to) {
      const piece = this.game.get(from);
      const isPawnPromotion = piece && piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

      if (isPawnPromotion) {
        // Afficher la modale de promotion pour choisir la pièce
        this.pendingPromotion = { from, to };
        this.showPromotionModal(piece.color);
      } else {
        this.makeMove({ from, to });
      }
    }

    showPromotionModal(color) {
      // Mettre à jour les icônes de la modale avec la bonne couleur
      ['q', 'r', 'b', 'n'].forEach(type => {
        const iconEl = document.getElementById(`promo-${type}`);
        const svgKey = color + type.toUpperCase();
        if (iconEl && window.CHESS_PIECES && window.CHESS_PIECES[svgKey]) {
          iconEl.innerHTML = window.CHESS_PIECES[svgKey];
        }
      });
      this.dom.modalPromotion.classList.remove('hidden');
    }

    choosePromotion(pieceType) {
      this.dom.modalPromotion.classList.add('hidden');
      if (this.pendingPromotion) {
        const { from, to } = this.pendingPromotion;
        this.pendingPromotion = null;
        this.makeMove({ from, to, promotion: pieceType });
      }
    }

    makeMove(moveObj) {
      const moveResult = this.game.move(moveObj);
      if (!moveResult) return false;

      this.lastMove = { from: moveResult.from, to: moveResult.to };

      // Sons du jeu
      if (this.game.in_checkmate()) {
        this.audio.playGameOver();
      } else if (this.game.in_check()) {
        this.audio.playCheck();
      } else if (moveResult.captured) {
        this.audio.playCapture();
      } else {
        this.audio.playMove();
      }

      this.render();

      // Vérifier fin de partie
      if (this.game.game_over()) {
        this.showGameOverModal();
        return true;
      }

      // Si c'est au tour de l'IA de jouer
      if (this.mode === 'ai' && this.game.turn() === this.aiColor) {
        this.triggerAiMove();
      }

      return true;
    }

    // ------------------------------------------------------------------------
    // Tour de l'IA (Asynchrone avec retour visuel)
    // ------------------------------------------------------------------------
    triggerAiMove() {
      this.isAiThinking = true;
      this.updateStatusAndUI();

      // Délai naturel pour donner l'impression de réflexion
      const thinkDelay = this.aiDifficulty === 3 ? 350 : 250;

      setTimeout(() => {
        const aiMove = this.ai.getBestMove(this.game, this.aiDifficulty);
        this.isAiThinking = false;

        if (aiMove) {
          this.makeMove(aiMove);
        } else {
          this.updateStatusAndUI();
        }
      }, thinkDelay);
    }

    // ------------------------------------------------------------------------
    // Annulation de coup (Undo)
    // ------------------------------------------------------------------------
    undoMove() {
      if (this.isAiThinking) return;

      if (this.mode === 'ai') {
        // En mode IA, annuler le coup de l'IA et le coup du joueur
        this.game.undo();
        this.game.undo();
      } else {
        // En mode 2 joueurs, annuler le coup précédent
        this.game.undo();
      }

      // Mettre à jour le dernier coup
      const history = this.game.history({ verbose: true });
      if (history.length > 0) {
        const prev = history[history.length - 1];
        this.lastMove = { from: prev.from, to: prev.to };
      } else {
        this.lastMove = null;
      }

      this.clearSelection();
    }

    // ------------------------------------------------------------------------
    // Mise à jour de l'Interface Utilisateur (Bandeaux, Historique, Captures)
    // ------------------------------------------------------------------------
    updateStatusAndUI() {
      const turn = this.game.turn();
      const inCheck = this.game.in_check();
      const gameOver = this.game.game_over();

      // 1. Bandeaux Joueurs Haut et Bas selon l'orientation (isFlipped)
      const topColor = this.isFlipped ? 'w' : 'b';
      const bottomColor = this.isFlipped ? 'b' : 'w';

      const isTopActive = (turn === topColor && !gameOver);
      const isBottomActive = (turn === bottomColor && !gameOver);

      this.dom.playerTop.classList.toggle('active-turn', isTopActive);
      this.dom.playerBottom.classList.toggle('active-turn', isBottomActive);

      // Titres des joueurs
      if (this.mode === 'ai') {
        const humanColor = (this.aiColor === 'w') ? 'b' : 'w';
        this.dom.nameTop.textContent = (topColor === this.aiColor) ? '🤖 IA Solo (Moteur)' : '👤 Vous';
        this.dom.nameBottom.textContent = (bottomColor === this.aiColor) ? '🤖 IA Solo (Moteur)' : '👤 Vous';
      } else {
        this.dom.nameTop.textContent = (topColor === 'w') ? 'Joueur Blancs' : 'Joueur Noirs';
        this.dom.nameBottom.textContent = (bottomColor === 'w') ? 'Joueur Blancs' : 'Joueur Noirs';
      }

      // Statut sous le nom
      if (isTopActive) {
        this.dom.subTop.textContent = this.isAiThinking ? 'Réfléchit au prochain coup...' : 'À vous de jouer';
        this.dom.subBottom.textContent = 'En attente';
      } else if (isBottomActive) {
        this.dom.subBottom.textContent = this.isAiThinking ? 'Réfléchit au prochain coup...' : 'À vous de jouer';
        this.dom.subTop.textContent = 'En attente';
      } else {
        this.dom.subTop.textContent = 'Partie terminée';
        this.dom.subBottom.textContent = 'Partie terminée';
      }

      // Alerte Échec sur le bandeau
      if (inCheck && !gameOver) {
        const checkedPlayerName = (turn === 'w') ? 'Blancs' : 'Noirs';
        this.dom.statusBanner.textContent = `⚠️ Échec au Roi (${checkedPlayerName}) !`;
        this.dom.statusBanner.className = 'status-banner alert';
        this.dom.statusBanner.classList.remove('hidden');
      } else if (this.isAiThinking) {
        this.dom.statusBanner.textContent = `🤖 L'IA réfléchit...`;
        this.dom.statusBanner.className = 'status-banner';
        this.dom.statusBanner.classList.remove('hidden');
      } else {
        this.dom.statusBanner.classList.add('hidden');
      }

      // 2. Pièces capturées & Évaluation matérielle
      this.updateCapturedAndAdvantage();

      // 3. Historique des coups
      this.updateHistoryTable();
    }

    updateCapturedAndAdvantage() {
      // Comptage des pièces présentes sur le plateau
      const counts = { w: { p:0, n:0, b:0, r:0, q:0 }, b: { p:0, n:0, b:0, r:0, q:0 } };
      const board = this.game.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type !== 'k') {
            counts[piece.color][piece.type]++;
          }
        }
      }

      // Pièces initiales
      const initial = { p:8, n:2, b:2, r:2, q:1 };
      const capturedByWhite = []; // Pièces noires capturées
      const capturedByBlack = []; // Pièces blanches capturées

      let scoreWhite = 0;
      let scoreBlack = 0;

      ['p', 'n', 'b', 'r', 'q'].forEach(type => {
        const val = PIECE_VALUES[type];
        // Noires perdues = prises par les Blancs
        const bLost = initial[type] - counts.b[type];
        for (let i = 0; i < bLost; i++) {
          capturedByWhite.push({ color: 'b', type });
          scoreWhite += val;
        }
        // Blanches perdues = prises par les Noirs
        const wLost = initial[type] - counts.w[type];
        for (let i = 0; i < wLost; i++) {
          capturedByBlack.push({ color: 'w', type });
          scoreBlack += val;
        }
      });

      // Rendu dans les bandeaux Haut / Bas selon orientation
      const topColor = this.isFlipped ? 'w' : 'b';
      const topCaptured = (topColor === 'w') ? capturedByWhite : capturedByBlack;
      const bottomCaptured = (topColor === 'w') ? capturedByBlack : capturedByWhite;

      this.renderCapturedList(this.dom.capturedTop, topCaptured);
      this.renderCapturedList(this.dom.capturedBottom, bottomCaptured);

      // Calcul avantage matériel (+1, +3...)
      const diff = Math.floor((scoreWhite - scoreBlack) / 100);
      this.dom.advTop.textContent = '';
      this.dom.advBottom.textContent = '';

      if (diff > 0) {
        // Avantage aux Blancs
        if (topColor === 'w') this.dom.advTop.textContent = `+${diff}`;
        else this.dom.advBottom.textContent = `+${diff}`;
      } else if (diff < 0) {
        // Avantage aux Noirs
        const absDiff = Math.abs(diff);
        if (topColor === 'b') this.dom.advTop.textContent = `+${absDiff}`;
        else this.dom.advBottom.textContent = `+${absDiff}`;
      }
    }

    renderCapturedList(container, piecesList) {
      container.innerHTML = '';
      // Trier par valeur
      piecesList.sort((a, b) => PIECE_VALUES[a.type] - PIECE_VALUES[b.type]);
      piecesList.forEach(p => {
        const svgKey = p.color + p.type.toUpperCase();
        if (window.CHESS_PIECES && window.CHESS_PIECES[svgKey]) {
          const wrapper = document.createElement('div');
          wrapper.className = 'captured-piece-img';
          wrapper.innerHTML = window.CHESS_PIECES[svgKey];
          container.appendChild(wrapper);
        }
      });
    }

    updateHistoryTable() {
      const history = this.game.history();
      const moveCount = history.length;
      this.dom.moveCounter.textContent = `${moveCount} coup${moveCount > 1 ? 's' : ''}`;

      if (moveCount === 0) {
        this.dom.historyEmpty.style.display = 'block';
        this.dom.historyTbody.innerHTML = '';
        return;
      }

      this.dom.historyEmpty.style.display = 'none';
      this.dom.historyTbody.innerHTML = '';

      for (let i = 0; i < moveCount; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = history[i] || '';
        const blackMove = history[i + 1] || '';

        const tr = document.createElement('tr');

        const tdNum = document.createElement('td');
        tdNum.className = 'td-num';
        tdNum.textContent = `${moveNum}.`;

        const tdWhite = document.createElement('td');
        const spanWhite = document.createElement('span');
        spanWhite.className = 'move-entry' + (i === moveCount - 1 ? ' latest' : '');
        spanWhite.textContent = whiteMove;
        tdWhite.appendChild(spanWhite);

        const tdBlack = document.createElement('td');
        if (blackMove) {
          const spanBlack = document.createElement('span');
          spanBlack.className = 'move-entry' + (i + 1 === moveCount - 1 ? ' latest' : '');
          spanBlack.textContent = blackMove;
          tdBlack.appendChild(spanBlack);
        }

        tr.appendChild(tdNum);
        tr.appendChild(tdWhite);
        tr.appendChild(tdBlack);
        this.dom.historyTbody.appendChild(tr);
      }

      // Défilement automatique vers le dernier coup
      this.dom.historyWrapper.scrollTop = this.dom.historyWrapper.scrollHeight;
    }

    // ------------------------------------------------------------------------
    // Fin de Partie & Modale
    // ------------------------------------------------------------------------
    showGameOverModal() {
      let title = "Partie Terminée";
      let desc = "";
      let icon = "🏁";

      if (this.game.in_checkmate()) {
        const winner = (this.game.turn() === 'w') ? "Les Noirs" : "Les Blancs";
        title = "Échec et Mat !";
        desc = `${winner} remportent la victoire par échec et mat !`;
        icon = "🏆";
      } else if (this.game.in_stalemate()) {
        title = "Pat (Match Nul)";
        desc = "Le joueur au trait n'a aucun coup légal et son roi n'est pas en échec.";
        icon = "🤝";
      } else if (this.game.in_threefold_repetition()) {
        title = "Nulle par Répétition";
        desc = "La même position a été répétée 3 fois.";
        icon = "🔄";
      } else if (this.game.insufficient_material()) {
        title = "Nulle par Matériel Insuffisant";
        desc = "Aucun des deux camps ne possède assez de matériel pour mater.";
        icon = "⚖️";
      } else if (this.game.in_draw()) {
        title = "Match Nul (50 coups)";
        desc = "50 coups consécutifs sans capture ni poussée de pion.";
        icon = "⏳";
      }

      const movesCount = this.game.history().length;
      this.dom.gameOverIcon.textContent = icon;
      this.dom.gameOverTitle.textContent = title;
      this.dom.gameOverDesc.textContent = desc;
      this.dom.gameOverStats.innerHTML = `
        <span><strong>${movesCount}</strong> coups joués</span>
        <span>Mode: <strong>${this.mode === 'ai' ? 'Solo IA' : '2 Joueurs'}</strong></span>
      `;

      this.dom.modalGameOver.classList.remove('hidden');
    }

    resetGame() {
      this.game.reset();
      this.selectedSquare = null;
      this.legalMovesFromSquare = [];
      this.lastMove = null;
      this.pendingPromotion = null;
      this.isAiThinking = false;
      this.dom.modalGameOver.classList.add('hidden');
      this.dom.modalPromotion.classList.add('hidden');

      this.render();

      if (this.mode === 'ai' && this.aiColor === 'w') {
        this.triggerAiMove();
      }
    }

    flipBoard() {
      this.isFlipped = !this.isFlipped;
      this.buildBoard();
      this.render();
    }

    cycleTheme() {
      this.themeIndex = (this.themeIndex + 1) % THEMES.length;
      THEMES.forEach(t => this.dom.board.classList.remove(t));
      this.dom.board.classList.add(THEMES[this.themeIndex]);
    }

    toggleSound() {
      this.audio.enabled = !this.audio.enabled;
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
    }

    // ------------------------------------------------------------------------
    // Liaison des Événements
    // ------------------------------------------------------------------------
    bindEvents() {
      // Nouvelle partie & actions
      this.dom.btnNewGame.addEventListener('click', () => this.resetGame());
      this.dom.btnUndo.addEventListener('click', () => this.undoMove());
      this.dom.btnFlip.addEventListener('click', () => this.flipBoard());
      this.dom.btnSound.addEventListener('click', () => this.toggleSound());
      this.dom.btnTheme.addEventListener('click', () => this.cycleTheme());

      // Règles
      this.dom.btnRules.addEventListener('click', () => this.dom.modalRules.classList.remove('hidden'));
      this.dom.btnRulesClose.addEventListener('click', () => this.dom.modalRules.classList.add('hidden'));
      this.dom.modalRules.addEventListener('click', (e) => {
        if (e.target === this.dom.modalRules) this.dom.modalRules.classList.add('hidden');
      });

      // Modale Fin de partie
      this.dom.btnGameOverRestart.addEventListener('click', () => this.resetGame());
      this.dom.btnGameOverClose.addEventListener('click', () => this.dom.modalGameOver.classList.add('hidden'));

      // Sélecteur de mode
      this.dom.modeAiBtn.addEventListener('click', () => {
        this.mode = 'ai';
        this.dom.modeAiBtn.classList.add('active');
        this.dom.modePvpBtn.classList.remove('active');
        this.dom.aiOptions.classList.remove('hidden');
        this.resetGame();
      });

      this.dom.modePvpBtn.addEventListener('click', () => {
        this.mode = 'pvp';
        this.dom.modePvpBtn.classList.add('active');
        this.dom.modeAiBtn.classList.remove('active');
        this.dom.aiOptions.classList.add('hidden');
        this.resetGame();
      });

      // Options IA
      this.dom.aiDifficultySelect.addEventListener('change', (e) => {
        this.aiDifficulty = parseInt(e.target.value, 10);
      });

      this.dom.aiSideSelect.addEventListener('change', (e) => {
        const playerSide = e.target.value;
        this.aiColor = (playerSide === 'w') ? 'b' : 'w';
        this.isFlipped = (playerSide === 'b');
        this.buildBoard();
        this.resetGame();
      });

      // Choix de promotion
      this.dom.promotionChoices.addEventListener('click', (e) => {
        const btn = e.target.closest('.promo-btn');
        if (btn && btn.dataset.piece) {
          this.choosePromotion(btn.dataset.piece);
        }
      });
    }
  }

  // Initialisation au chargement du DOM
  window.addEventListener('DOMContentLoaded', () => {
    window.chessApp = new ChessApp();
  });

})();
