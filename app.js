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

  const THEMES = ['theme-wood', 'theme-classic', 'theme-slate'];
  const THEME_LABELS = {
    'theme-wood': 'Bois Noble & Noyer',
    'theme-classic': 'Tournoi Classique',
    'theme-slate': 'Ardoise Moderne'
  };

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
  // 3. Moteur IA MiniMax avec Élagage Alpha-Bêta & Quiescence Simplifiée
  // --------------------------------------------------------------------------
  class ChessAI {
    constructor() {
      this.depth = 2;
    }

    // Évaluation heuristique du plateau avec bonus pour les mats rapides
    evaluate(game, depthRemaining = 0) {
      if (game.in_checkmate()) {
        // Favoriser un mat plus rapide (score plus extrême quand depthRemaining est grand)
        const mateBonus = depthRemaining * 500;
        return game.turn() === 'w' ? -(99999 + mateBonus) : (99999 + mateBonus);
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

    // Tri des coups (Move Ordering MVV-LVA + Promotions + Roque)
    orderMoves(moves) {
      return moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.captured) {
          scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
        }
        if (a.promotion) scoreA += PIECE_VALUES[a.promotion] || 800;
        if (a.flags && (a.flags.includes('k') || a.flags.includes('q'))) scoreA += 60;

        if (b.captured) {
          scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
        }
        if (b.promotion) scoreB += PIECE_VALUES[b.promotion] || 800;
        if (b.flags && (b.flags.includes('k') || b.flags.includes('q'))) scoreB += 60;

        return scoreB - scoreA;
      });
    }

    minimax(game, depth, alpha, beta, isMaximizing) {
      if (depth === 0 || game.game_over()) {
        return this.evaluate(game, depth);
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

    // Sélection du meilleur coup avec variété sur les ex-aequo
    getBestMove(game, depth = 2) {
      const rawMoves = game.moves({ verbose: true });
      if (!rawMoves || rawMoves.length === 0) return null;

      // Niveau 1 (Débutant) : Choix rapide et opportuniste
      if (depth === 1) {
        const captures = rawMoves.filter(m => m.captured);
        if (captures.length > 0 && Math.random() < 0.65) {
          return captures[Math.floor(Math.random() * captures.length)];
        }
        return rawMoves[Math.floor(Math.random() * rawMoves.length)];
      }

      const isMaximizing = (game.turn() === 'w');
      let bestMove = null;
      let bestValue = isMaximizing ? -Infinity : Infinity;
      let alpha = -Infinity;
      let beta = Infinity;

      // Mélanger légèrement les coups avant de les trier pour varier les ouvertures à score égal
      const shuffledMoves = rawMoves.sort(() => Math.random() - 0.5);
      const orderedMoves = this.orderMoves(shuffledMoves);

      for (let i = 0; i < orderedMoves.length; i++) {
        const move = orderedMoves[i];
        game.move(move);
        const value = this.minimax(game, depth - 1, alpha, beta, !isMaximizing);
        game.undo();

        if (isMaximizing) {
          if (value > bestValue) {
            bestValue = value;
            bestMove = move;
          }
          alpha = Math.max(alpha, bestValue);
        } else {
          if (value < bestValue) {
            bestValue = value;
            bestMove = move;
          }
          beta = Math.min(beta, bestValue);
        }
      }

      return bestMove || orderedMoves[0];
    }
  }

  // --------------------------------------------------------------------------
  // 4. Contrôleur Principal du Jeu
  // --------------------------------------------------------------------------
  class ChessApp {
    constructor() {
      const ChessConstructor = window.Chess || (typeof Chess !== 'undefined' ? Chess : null);
      if (!ChessConstructor) {
        throw new Error('Chess engine library not found on window or global scope!');
      }
      this.game = new ChessConstructor();
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
      this.aiTimer = null; // Identifiant du timer IA pour éviter les race conditions
      this.toastTimer = null;

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
        btnCopyPgn: document.getElementById('btn-copy-pgn'),
        btnCopyFen: document.getElementById('btn-copy-fen'),
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
        modalRules: document.getElementById('modal-rules'),
        toast: document.getElementById('toast-notification')
      };

      this.init();
    }

    init() {
      this.loadPreferences();
      this.bindEvents();
      this.buildBoard();
      this.render();

      // Si l'IA commence (humain avec les Noirs en mode IA)
      if (this.mode === 'ai' && this.aiColor === 'w') {
        this.triggerAiMove();
      }
    }

    // ------------------------------------------------------------------------
    // Préférences Utilisateur (localStorage) & Notifications
    // ------------------------------------------------------------------------
    loadPreferences() {
      try {
        const savedSound = localStorage.getItem('chess_sound');
        if (savedSound !== null) {
          this.audio.enabled = savedSound === 'true';
          if (this.dom.soundIcon) {
            this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
          }
        }
        const savedTheme = localStorage.getItem('chess_theme_idx');
        if (savedTheme !== null) {
          const idx = parseInt(savedTheme, 10);
          if (!isNaN(idx) && idx >= 0 && idx < THEMES.length) {
            this.themeIndex = idx;
            THEMES.forEach(t => this.dom.board.classList.remove(t));
            this.dom.board.classList.add(THEMES[this.themeIndex]);
          }
        }
      } catch (e) {
        // Ignorer si localStorage est désactivé
      }
    }

    savePreferences() {
      try {
        localStorage.setItem('chess_sound', String(this.audio.enabled));
        localStorage.setItem('chess_theme_idx', String(this.themeIndex));
      } catch (e) {
        // Ignorer
      }
    }

    showToast(message) {
      if (!this.dom.toast) return;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.dom.toast.textContent = message;
      this.dom.toast.classList.remove('hidden');
      this.toastTimer = setTimeout(() => {
        this.dom.toast.classList.add('hidden');
      }, 2400);
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

          // Déterminer la couleur de la case (Standard FIDE : a1 = foncée, h1 = claire)
          const fileIdx = files.indexOf(file);
          const rankIdx = parseInt(rank, 10);
          const isLight = (fileIdx + rankIdx) % 2 === 0;
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
      const kingSquareInCheck = this.game.in_check() ? this.getKingSquare(this.game.turn()) : null;

      // Parcourir toutes les cases du DOM
      const squares = this.dom.board.querySelectorAll('.square');
      squares.forEach(sq => {
        const sqName = sq.dataset.square;
        sq.innerHTML = '';
        const fileIdx = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].indexOf(sqName[0]);
        const rankIdx = parseInt(sqName[1], 10);
        const isLight = (fileIdx + rankIdx) % 2 === 0;
        sq.className = 'square ' + (isLight ? 'light' : 'dark');

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

        // Surbrillance des coups possibles (prise standard 'c' ou prise en passant 'e')
        const legalMove = this.legalMovesFromSquare.find(m => m.to === sqName);
        if (legalMove) {
          const isCapture = Boolean(
            legalMove.captured ||
            (legalMove.flags && (legalMove.flags.includes('c') || legalMove.flags.includes('e')))
          );
          if (isCapture) {
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

    // Drag and drop (CORRIGÉ : pas de reconstruction DOM synchrone dans dragstart)
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

      // Appliquer les classes d'indices visuels directement sans détruire le nœud glissé
      const squares = this.dom.board.querySelectorAll('.square');
      squares.forEach(sq => {
        const sqName = sq.dataset.square;
        sq.classList.remove('selected', 'hint-move', 'hint-capture');
        if (sqName === squareName) {
          sq.classList.add('selected');
        }
        const legalMove = this.legalMovesFromSquare.find(m => m.to === sqName);
        if (legalMove) {
          const isCapture = Boolean(
            legalMove.captured ||
            (legalMove.flags && (legalMove.flags.includes('c') || legalMove.flags.includes('e')))
          );
          sq.classList.add(isCapture ? 'hint-capture' : 'hint-move');
        }
      });
    }

    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    handleDrop(targetSquare, event) {
      event.preventDefault();
      const fromSquare = event.dataTransfer.getData('text/plain') || this.selectedSquare;
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

    cancelPromotion() {
      this.dom.modalPromotion.classList.add('hidden');
      this.pendingPromotion = null;
      this.clearSelection();
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
    // Tour de l'IA (Asynchrone sécurisé contre les race conditions)
    // ------------------------------------------------------------------------
    triggerAiMove() {
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
      }

      this.isAiThinking = true;
      this.updateStatusAndUI();

      // Délai naturel pour donner l'impression de réflexion
      const thinkDelay = this.aiDifficulty === 3 ? 320 : 240;

      this.aiTimer = setTimeout(() => {
        this.aiTimer = null;
        // Vérifier que le mode et le tour n'ont pas changé entre-temps
        if (this.mode !== 'ai' || this.game.turn() !== this.aiColor || this.game.game_over()) {
          this.isAiThinking = false;
          this.updateStatusAndUI();
          return;
        }

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
    // Annulation de coup (Undo sécurisé pour Blancs et Noirs)
    // ------------------------------------------------------------------------
    undoMove() {
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
        this.isAiThinking = false;
      }

      const historyLen = this.game.history().length;
      if (historyLen === 0) {
        this.showToast('Aucun coup à annuler.');
        return;
      }

      if (this.mode === 'ai') {
        const humanColor = (this.aiColor === 'w') ? 'b' : 'w';
        // Si l'humain joue les Noirs et que seule l'IA a joué le 1er coup, ne pas vider la partie en laissant l'humain bloqué
        if (this.aiColor === 'w' && historyLen <= 1) {
          this.showToast('C\'est déjà à votre tour de jouer le premier coup des Noirs !');
          return;
        }

        // Si c'est au tour de l'humain, on annule le coup de l'IA puis le coup de l'humain
        if (this.game.turn() === humanColor && historyLen >= 2) {
          this.game.undo();
          this.game.undo();
        } else {
          // Si on a interrompu l'IA pendant sa réflexion ou si la partie vient de se terminer sur le coup de l'humain
          this.game.undo();
        }
      } else {
        // En mode 2 joueurs, annuler le coup précédent
        this.game.undo();
      }

      // Fermer la modale de fin de partie si elle était ouverte
      this.dom.modalGameOver.classList.add('hidden');

      // Mettre à jour le dernier coup
      const history = this.game.history({ verbose: true });
      if (history.length > 0) {
        const prev = history[history.length - 1];
        this.lastMove = { from: prev.from, to: prev.to };
      } else {
        this.lastMove = null;
      }

      this.clearSelection();

      // Si après annulation c'est au tour de l'IA (ex: début de partie avec les Noirs)
      if (this.mode === 'ai' && this.game.turn() === this.aiColor && !this.game.game_over()) {
        this.triggerAiMove();
      }
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

      // Mettre à jour les avatars dynamiquement selon la couleur en haut et en bas
      if (this.dom.avatarTop) {
        this.dom.avatarTop.textContent = (topColor === 'w') ? '♙' : '♟️';
      }
      if (this.dom.avatarBottom) {
        this.dom.avatarBottom.textContent = (bottomColor === 'w') ? '♙' : '♟️';
      }

      // Titres des joueurs
      if (this.mode === 'ai') {
        const topColorLabel = (topColor === 'w') ? 'Blancs' : 'Noirs';
        const bottomColorLabel = (bottomColor === 'w') ? 'Blancs' : 'Noirs';
        this.dom.nameTop.textContent = (topColor === this.aiColor)
          ? `🤖 IA Solo (${topColorLabel})`
          : `👤 Vous (${topColorLabel})`;
        this.dom.nameBottom.textContent = (bottomColor === this.aiColor)
          ? `🤖 IA Solo (${bottomColorLabel})`
          : `👤 Vous (${bottomColorLabel})`;
      } else {
        this.dom.nameTop.textContent = (topColor === 'w') ? 'Joueur 1 (Blancs)' : 'Joueur 2 (Noirs)';
        this.dom.nameBottom.textContent = (bottomColor === 'w') ? 'Joueur 1 (Blancs)' : 'Joueur 2 (Noirs)';
      }

      // Statut sous le nom
      if (isTopActive) {
        this.dom.subTop.textContent = this.isAiThinking ? 'Réfléchit au prochain coup...' : 'Trait à ce joueur';
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
        this.dom.statusBanner.textContent = `🤖 L'IA calcule le meilleur coup...`;
        this.dom.statusBanner.className = 'status-banner';
        this.dom.statusBanner.classList.remove('hidden');
      } else {
        this.dom.statusBanner.classList.add('hidden');
      }

      // 2. Pièces capturées & Évaluation matérielle (basé sur l'historique exact des prises + promotions)
      this.updateCapturedAndAdvantage();

      // 3. Historique des coups
      this.updateHistoryTable();
    }

    updateCapturedAndAdvantage() {
      // Utiliser l'historique réel des coups pour connaître les pièces véritablement capturées
      // (Évite les valeurs négatives lorsqu'un pion est promu en 2ème Dame !)
      const verboseHistory = this.game.history({ verbose: true });
      const capturedByWhite = []; // Pièces noires capturées par les Blancs
      const capturedByBlack = []; // Pièces blanches capturées par les Noirs

      verboseHistory.forEach(move => {
        if (move.captured) {
          if (move.color === 'w') {
            capturedByWhite.push({ color: 'b', type: move.captured });
          } else {
            capturedByBlack.push({ color: 'w', type: move.captured });
          }
        }
      });

      // Calculer le matériel réel sur l'échiquier (incluant la valeur des pions promus)
      let scoreWhite = 0;
      let scoreBlack = 0;
      const board = this.game.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type !== 'k') {
            const val = PIECE_VALUES[piece.type] || 0;
            if (piece.color === 'w') scoreWhite += val;
            else scoreBlack += val;
          }
        }
      }

      // Rendu dans les bandeaux Haut / Bas selon orientation
      const topColor = this.isFlipped ? 'w' : 'b';
      const topCaptured = (topColor === 'w') ? capturedByWhite : capturedByBlack;
      const bottomCaptured = (topColor === 'w') ? capturedByBlack : capturedByWhite;

      this.renderCapturedList(this.dom.capturedTop, topCaptured);
      this.renderCapturedList(this.dom.capturedBottom, bottomCaptured);

      // Calcul avantage matériel (+1, +3...)
      const diff = Math.round((scoreWhite - scoreBlack) / 100);
      this.dom.advTop.textContent = '';
      this.dom.advBottom.textContent = '';

      if (diff > 0) {
        if (topColor === 'w') this.dom.advTop.textContent = `+${diff}`;
        else this.dom.advBottom.textContent = `+${diff}`;
      } else if (diff < 0) {
        const absDiff = Math.abs(diff);
        if (topColor === 'b') this.dom.advTop.textContent = `+${absDiff}`;
        else this.dom.advBottom.textContent = `+${absDiff}`;
      }
    }

    renderCapturedList(container, piecesList) {
      container.innerHTML = '';
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

      this.dom.historyWrapper.scrollTop = this.dom.historyWrapper.scrollHeight;
    }

    // ------------------------------------------------------------------------
    // Export PGN / FEN
    // ------------------------------------------------------------------------
    copyPgnToClipboard() {
      const pgn = this.game.pgn() || 'Aucun coup joué.';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pgn).then(() => {
          this.showToast('📋 Notation PGN copiée dans le presse-papiers !');
        }).catch(() => {
          this.showToast('Impossible de copier le PGN.');
        });
      } else {
        this.showToast(`PGN : ${pgn}`);
      }
    }

    copyFenToClipboard() {
      const fen = this.game.fen();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fen).then(() => {
          this.showToast('🧬 Position FEN copiée dans le presse-papiers !');
        }).catch(() => {
          this.showToast('Impossible de copier le FEN.');
        });
      } else {
        this.showToast(`FEN : ${fen}`);
      }
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
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
      }

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
      const newTheme = THEMES[this.themeIndex];
      THEMES.forEach(t => this.dom.board.classList.remove(t));
      this.dom.board.classList.add(newTheme);
      this.savePreferences();
      this.showToast(`🎨 Thème : ${THEME_LABELS[newTheme]}`);
    }

    toggleSound() {
      this.audio.enabled = !this.audio.enabled;
      this.dom.soundIcon.textContent = this.audio.enabled ? '🔊' : '🔇';
      this.savePreferences();
      this.showToast(this.audio.enabled ? '🔊 Effets sonores activés' : '🔇 Effets sonores désactivés');
    }

    // ------------------------------------------------------------------------
    // Liaison des Événements & Raccourcis Clavier
    // ------------------------------------------------------------------------
    bindEvents() {
      // Nouvelle partie & actions
      this.dom.btnNewGame.addEventListener('click', () => this.resetGame());
      this.dom.btnUndo.addEventListener('click', () => this.undoMove());
      this.dom.btnFlip.addEventListener('click', () => this.flipBoard());
      this.dom.btnSound.addEventListener('click', () => this.toggleSound());
      this.dom.btnTheme.addEventListener('click', () => this.cycleTheme());

      if (this.dom.btnCopyPgn) {
        this.dom.btnCopyPgn.addEventListener('click', () => this.copyPgnToClipboard());
      }
      if (this.dom.btnCopyFen) {
        this.dom.btnCopyFen.addEventListener('click', () => this.copyFenToClipboard());
      }

      // Règles
      this.dom.btnRules.addEventListener('click', () => this.dom.modalRules.classList.remove('hidden'));
      this.dom.btnRulesClose.addEventListener('click', () => this.dom.modalRules.classList.add('hidden'));
      this.dom.modalRules.addEventListener('click', (e) => {
        if (e.target === this.dom.modalRules) this.dom.modalRules.classList.add('hidden');
      });

      // Modale Promotion : clic à l'extérieur annule la promotion en cours
      this.dom.modalPromotion.addEventListener('click', (e) => {
        if (e.target === this.dom.modalPromotion) {
          this.cancelPromotion();
        }
      });

      // Modale Fin de partie
      this.dom.btnGameOverRestart.addEventListener('click', () => this.resetGame());
      this.dom.btnGameOverClose.addEventListener('click', () => this.dom.modalGameOver.classList.add('hidden'));
      this.dom.modalGameOver.addEventListener('click', (e) => {
        if (e.target === this.dom.modalGameOver) this.dom.modalGameOver.classList.add('hidden');
      });

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

      // Raccourcis clavier (Escape pour fermer modale / désélectionner, Ctrl+Z pour annuler, F pour tourner)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!this.dom.modalPromotion.classList.contains('hidden')) {
            this.cancelPromotion();
          } else if (!this.dom.modalRules.classList.contains('hidden')) {
            this.dom.modalRules.classList.add('hidden');
          } else if (!this.dom.modalGameOver.classList.contains('hidden')) {
            this.dom.modalGameOver.classList.add('hidden');
          } else if (this.selectedSquare) {
            this.clearSelection();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          this.undoMove();
        } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'SELECT') {
          this.flipBoard();
        }
      });
    }
  }

  // Initialisation sécurisée au chargement du DOM
  function initChess() {
    try {
      window.chessApp = new ChessApp();
    } catch (err) {
      console.error('ChessApp init error:', err);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initChess);
  } else {
    initChess();
  }

})();
