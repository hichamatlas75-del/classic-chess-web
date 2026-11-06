/**
 * ============================================================================
 * Échecs Classiques - Application Principale (app.js)
 * Architecture Vanilla JS ES6+ - Règles FIDE, Moteur IA MiniMax & Guide Apprenti
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

  const PIECE_NAMES_FR = {
    p: 'le Pion',
    n: 'le Cavalier',
    b: 'le Fou',
    r: 'la Tour',
    q: 'la Dame',
    k: 'le Roi'
  };

  const PIECE_TITLES_FR = {
    p: 'Pion',
    n: 'Cavalier',
    b: 'Fou',
    r: 'Tour',
    q: 'Dame',
    k: 'Roi'
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

  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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
      this.playTone(520, 0.12, 'sine', 0.2);
      setTimeout(() => this.playTone(680, 0.22, 'sine', 0.25), 110);
    }

    playError() {
      // Buzzer sourd pour signaler un coup illégal
      this.playTone(155, 0.18, 'sawtooth', 0.18);
      setTimeout(() => this.playTone(125, 0.22, 'sawtooth', 0.18), 90);
    }

    playGameOver() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.4, 'triangle', 0.2), i * 130);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. Guide Pédagogique Intelligent pour Apprentis (Diagnostic des Coups)
  // --------------------------------------------------------------------------
  class ApprenticeCoach {
    /**
     * Donne un rappel de la règle lorsqu'un joueur sélectionne une pièce
     */
    getSelectionGuide(piece, square, legalMovesCount) {
      const pTitle = PIECE_TITLES_FR[piece.type];
      const isWhite = piece.color === 'w';

      const rulesByPiece = {
        p: {
          title: `♟️ ${pTitle} sélectionné en ${square.toUpperCase()}`,
          text: isWhite
            ? `Le pion blanc avance vers le haut (rangée ${ parseInt(square[1], 10) + 1 }). Il avance d'1 case tout droit (ou 2 cases depuis la rangée 2) et capture uniquement d'1 case en diagonale vers l'avant.`
            : `Le pion noir avance vers le bas (rangée ${ parseInt(square[1], 10) - 1 }). Il avance d'1 case tout droit (ou 2 cases depuis la rangée 7) et capture uniquement d'1 case en diagonale vers l'avant.`,
          rule: `📖 Astuce : Un pion ne recule jamais et ne peut pas capturer la pièce située juste devant lui.`
        },
        n: {
          title: `🐴 ${pTitle} sélectionné en ${square.toUpperCase()}`,
          text: `Le Cavalier se déplace en forme de « L » : 2 cases dans une direction (horizontale ou verticale) puis 1 case sur le côté.`,
          rule: `📖 Privilège unique : C'est la seule pièce capable de sauter par-dessus les autres pièces !`
        },
        b: {
          title: `♝ ${pTitle} sélectionné en ${square.toUpperCase()}`,
          text: `Le Fou glisse en diagonale d'autant de cases libres qu'il le souhaite, mais reste toujours sur les cases de sa couleur d'origine.`,
          rule: `📖 Interdiction : Il ne peut jamais sauter par-dessus une pièce qui lui barre la diagonale.`
        },
        r: {
          title: `♜ ${pTitle} sélectionnée en ${square.toUpperCase()}`,
          text: `La Tour se déplace horizontalement (sur la rangée) ou verticalement (sur la colonne) d'autant de cases libres que voulu.`,
          rule: `📖 Roque : Elle peut participer au Roque avec le Roi si ni l'un ni l'autre n'ont encore bougé.`
        },
        q: {
          title: `♛ ${pTitle} sélectionnée en ${square.toUpperCase()}`,
          text: `Pièce la plus puissante du jeu ! La Dame combine les mouvements de la Tour et du Fou : lignes, colonnes et diagonales.`,
          rule: `📖 Attention : Malgré sa puissance, elle ne peut pas sauter par-dessus une pièce ni bouger en « L » comme le Cavalier.`
        },
        k: {
          title: `♚ ${pTitle} sélectionné en ${square.toUpperCase()}`,
          text: `Le Roi se déplace d'une seule case dans n'importe quelle direction (ou de 2 cases vers une Tour lors du Roque).`,
          rule: `📖 Règle d'Or FIDE : Le Roi ne peut jamais se déplacer sur une case contrôlée par une pièce adverse.`
        }
      };

      const guide = rulesByPiece[piece.type];
      if (legalMovesCount === 0) {
        return {
          type: 'error',
          title: `🚫 ${pTitle} en ${square.toUpperCase()} est bloqué !`,
          text: `Cette pièce n'a aucun coup légal disponible actuellement (soit ses chemins sont obstrués, soit la bouger exposerait votre Roi à un échec).`,
          rule: `💡 Choisissez une autre pièce de votre camp.`
        };
      }
      return {
        type: 'info',
        title: guide.title,
        text: guide.text,
        rule: `${guide.rule} (${legalMovesCount} destination${legalMovesCount > 1 ? 's' : ''} possible${legalMovesCount > 1 ? 's' : ''})`
      };
    }

    /**
     * Analyse précisément pourquoi un déplacement de `from` vers `to` est illégal
     */
    explainIllegalMove(game, from, to) {
      const piece = game.get(from);
      if (!piece) return null;

      const targetPiece = game.get(to);
      const fromFile = FILES.indexOf(from[0]);
      const fromRank = parseInt(from[1], 10);
      const toFile = FILES.indexOf(to[0]);
      const toRank = parseInt(to[1], 10);

      const df = toFile - fromFile;
      const dr = toRank - fromRank;
      const absDf = Math.abs(df);
      const absDr = Math.abs(dr);
      const forwardDir = piece.color === 'w' ? 1 : -1;
      const startRank = piece.color === 'w' ? 2 : 7;

      const pieceLabel = PIECE_TITLES_FR[piece.type];
      const moveLabel = `${from.toUpperCase()} → ${to.toUpperCase()}`;

      // 0. Case occupée par une pièce alliée
      if (targetPiece && targetPiece.color === piece.color) {
        return {
          type: 'error',
          title: `❌ Case occupée par votre propre camp (${moveLabel})`,
          text: `La case ${to.toUpperCase()} contient déjà ${PIECE_NAMES_FR[targetPiece.type]} de votre couleur. On ne peut jamais capturer ni se superposer à ses propres pièces.`,
          rule: `📖 Règle : Sélectionnez une case vide ou une case occupée par une pièce adverse.`
        };
      }

      // ======================================================================
      // 1. DIAGNOSTIC DÉTAILLÉ POUR LE PION (Priorité Apprenti)
      // ======================================================================
      if (piece.type === 'p') {
        // 1.a) Tentative de reculer avec un pion
        if ((piece.color === 'w' && dr < 0) || (piece.color === 'b' && dr > 0)) {
          return {
            type: 'error',
            title: `❌ Déplacement de Pion interdit : Marche arrière (${moveLabel})`,
            text: `Vous avez tenté de faire reculer votre pion de la rangée ${fromRank} vers la rangée ${toRank}. Aux échecs, les pions sont des fantassins qui avancent uniquement vers le camp adverse et ne peuvent jamais reculer !`,
            rule: `📖 Règle du Pion : Les pions Blancs montent toujours (1 → 8) et les pions Noirs descendent toujours (8 → 1).`
          };
        }

        // 1.b) Tentative de déplacement horizontal (sur le côté)
        if (dr === 0 && absDf > 0) {
          return {
            type: 'error',
            title: `❌ Déplacement de Pion interdit : Mouvement latéral (${moveLabel})`,
            text: `Vous essayez de déplacer votre pion horizontalement sur la même rangée (${fromRank}). Un pion ne peut jamais marcher de côté.`,
            rule: `📖 Règle du Pion : Le pion avance tout droit sur sa colonne (${from[0].toUpperCase()}) ou capture d'une case en diagonale vers l'avant.`
          };
        }

        // 1.c) Tentative d'avancer tout droit sur une case occupée (tentative de capture frontale)
        if (df === 0 && dr === forwardDir && targetPiece) {
          return {
            type: 'error',
            title: `❌ Pion bloqué : Capture frontale interdite (${moveLabel})`,
            text: `La case ${to.toUpperCase()} juste devant votre pion est occupée par ${PIECE_NAMES_FR[targetPiece.type]} adverse. Contrairement aux autres pièces, le pion ne capture jamais dans le sens de sa marche !`,
            rule: `📖 Règle du Pion : Le pion avance tout droit sur une case vide, mais il capture exclusivement d'1 case en diagonale vers l'avant.`
          };
        }

        // 1.d) Tentative d'avancer de 2 cases alors que le pion a déjà bougé
        if (df === 0 && dr === 2 * forwardDir && fromRank !== startRank) {
          return {
            type: 'error',
            title: `❌ Déplacement de Pion interdit : Double pas hors départ (${moveLabel})`,
            text: `Votre pion se trouve sur la rangée ${fromRank}. Le sprint de 2 cases n'est autorisé que lorsque le pion est encore sur sa rangée de départ (rangée ${startRank}) !`,
            rule: `📖 Règle du Pion : Dès son deuxième mouvement, un pion ne peut avancer que d'une seule case à la fois.`
          };
        }

        // 1.e) Tentative d'avancer de 2 cases depuis la case de départ mais chemin bloqué
        if (df === 0 && dr === 2 * forwardDir && fromRank === startRank) {
          const midRank = fromRank + forwardDir;
          const midSquare = from[0] + midRank;
          const midPiece = game.get(midSquare);
          if (midPiece) {
            return {
              type: 'error',
              title: `❌ Déplacement de Pion interdit : Saut d'obstacle (${moveLabel})`,
              text: `Vous tentez d'avancer votre pion de 2 cases, mais la case intermédiaire ${midSquare.toUpperCase()} est bloquée par ${PIECE_NAMES_FR[midPiece.type]}. Le pion ne peut pas sauter par-dessus une pièce !`,
              rule: `📖 Règle : Pour avancer de 2 cases au départ, la première ET la deuxième case doivent être totalement vides.`
            };
          }
          if (targetPiece) {
            return {
              type: 'error',
              title: `❌ Déplacement de Pion interdit : Case d'arrivée occupée (${moveLabel})`,
              text: `Vous ne pouvez pas avancer de 2 cases sur ${to.toUpperCase()} car cette case est occupée par ${PIECE_NAMES_FR[targetPiece.type]} et le pion ne capture pas tout droit.`,
              rule: `📖 Règle du Pion : L'avance de 2 cases ne permet jamais de capturer une pièce.`
            };
          }
        }

        // 1.f) Tentative d'aller en diagonale d'1 case vers l'avant sur une case VIDE (hors prise en passant valide)
        if (absDf === 1 && dr === forwardDir && !targetPiece) {
          // Vérifier si l'apprenti tentait une prise en passant illégale
          const adjacentSq = to[0] + fromRank;
          const adjPiece = game.get(adjacentSq);
          if (adjPiece && adjPiece.type === 'p' && adjPiece.color !== piece.color) {
            return {
              type: 'error',
              title: `❌ Prise en Passant non valide (${moveLabel})`,
              text: `Il y a bien un pion adverse en ${adjacentSq.toUpperCase()}, mais la « Prise en Passant » n'est permise que si ce pion vient tout juste d'avancer de 2 cases au coup immédiatement précédent !`,
              rule: `📖 Règle FIDE : Si vous ne prenez pas en passant immédiatement après le double pas adverse, le droit s'éteint.`
            };
          }
          return {
            type: 'error',
            title: `❌ Déplacement de Pion interdit : Diagonale sans capture (${moveLabel})`,
            text: `Vous tentez de déplacer votre pion en diagonale vers la case ${to.toUpperCase()}, mais cette case est vide ! Un pion ne peut aller en diagonale que pour capturer une pièce adverse.`,
            rule: `📖 Règle du Pion : Sans pièce adverse à capturer en diagonale, le pion doit avancer tout droit sur la colonne ${from[0].toUpperCase()}.`
          };
        }

        // 1.g) Tentative d'avancer de 3 cases ou plus, ou grande diagonale
        if (absDr > 2 || absDf > 1 || (absDr === 2 && absDf >= 1)) {
          return {
            type: 'error',
            title: `❌ Déplacement de Pion trop long (${moveLabel})`,
            text: `Vous essayez de déplacer votre pion de ${absDr} rangée(s) et ${absDf} colonne(s). La portée d'un pion est limitée à 1 seule case en avant (ou 2 au départ).`,
            rule: `📖 Règle du Pion : Avancez d'une case sur la colonne ${from[0].toUpperCase()} jusqu'à la 8ème rangée pour le promouvoir en Dame !`
          };
        }
      }

      // ======================================================================
      // 2. DIAGNOSTIC POUR LES AUTRES PIÈCES (Cavalier, Fou, Tour, Dame, Roi)
      // ======================================================================
      let isGeometricallyValid = false;
      let pathChecked = false;

      if (piece.type === 'n') {
        isGeometricallyValid = (absDf === 1 && absDr === 2) || (absDf === 2 && absDr === 1);
        if (!isGeometricallyValid) {
          return {
            type: 'error',
            title: `❌ Mouvement de Cavalier invalide (${moveLabel})`,
            text: `Le Cavalier ne se déplace ni en ligne droite ni en diagonale simple. Il doit obligatoirement dessiner un « L » (2 cases dans un sens + 1 case perpendiculaire).`,
            rule: `📖 Astuce : Un Cavalier change toujours de couleur de case à chaque saut (case claire → case foncée).`
          };
        }
      } else if (piece.type === 'b') {
        isGeometricallyValid = (absDf === absDr && absDf > 0);
        if (!isGeometricallyValid) {
          return {
            type: 'error',
            title: `❌ Mouvement de Fou invalide (${moveLabel})`,
            text: `Vous tentez un déplacement non-diagonal avec votre Fou. Le Fou ne peut glisser qu'en diagonale et ne change jamais de couleur de case !`,
            rule: `📖 Règle du Fou : Seule la Tour ou la Dame peuvent se déplacer en ligne droite ou colonne.`
          };
        }
        pathChecked = true;
      } else if (piece.type === 'r') {
        isGeometricallyValid = (df === 0 && absDr > 0) || (dr === 0 && absDf > 0);
        if (!isGeometricallyValid) {
          return {
            type: 'error',
            title: `❌ Mouvement de Tour invalide (${moveLabel})`,
            text: `La Tour ne peut pas se déplacer en diagonale ! Elle se déplace uniquement horizontalement (sur une rangée) ou verticalement (sur une colonne).`,
            rule: `📖 Règle de la Tour : Pour bouger en diagonale, utilisez un Fou ou la Dame.`
          };
        }
        pathChecked = true;
      } else if (piece.type === 'q') {
        isGeometricallyValid = (absDf === absDr && absDf > 0) || (df === 0 && absDr > 0) || (dr === 0 && absDf > 0);
        if (!isGeometricallyValid) {
          return {
            type: 'error',
            title: `❌ Mouvement de Dame invalide (${moveLabel})`,
            text: `La Dame se déplace en ligne droite (comme la Tour) ou en diagonale (comme le Fou), mais elle ne peut pas se déplacer en « L » comme un Cavalier ni en courbe.`,
            rule: `📖 Règle de la Dame : Choisissez un alignement horizontal, vertical ou diagonal parfait.`
          };
        }
        pathChecked = true;
      } else if (piece.type === 'k') {
        // Cas spécial d'une tentative de Roque illégale (déplacement horizontal de 2 cases)
        if (dr === 0 && absDf === 2) {
          return this.explainIllegalCastling(game, piece, from, to, df);
        }
        isGeometricallyValid = (absDf <= 1 && absDr <= 1 && (absDf + absDr > 0));
        if (!isGeometricallyValid) {
          return {
            type: 'error',
            title: `❌ Déplacement du Roi trop éloigné (${moveLabel})`,
            text: `Le Roi se déplace avec prudence : il ne peut franchir qu'une seule case à la fois (sauf lors du Roque valide de 2 cases).`,
            rule: `📖 Règle du Roi : Avancez d'une seule case autour du Roi.`
          };
        }
      }

      // 3. Vérifier si une pièce bloque le chemin (pour Fou, Tour, Dame)
      if (pathChecked) {
        const blocker = this.findBlockingPiece(game, fromFile, fromRank, toFile, toRank);
        if (blocker) {
          return {
            type: 'error',
            title: `❌ Trajectoire bloquée en ${blocker.square.toUpperCase()} (${moveLabel})`,
            text: `Votre ${pieceLabel} ne peut pas atteindre ${to.toUpperCase()} car ${PIECE_NAMES_FR[blocker.piece.type]} en ${blocker.square.toUpperCase()} barre le passage. Seul le Cavalier a le droit de sauter par-dessus d'autres pièces !`,
            rule: `📖 Règle : Les Fous, les Tours et la Dame s'arrêtent devant le premier obstacle.`
          };
        }
      }

      // ======================================================================
      // 4. LE COUP EST GÉOMÉTRIQUEMENT VALIDE MAIS LAISSE LE ROI EN ÉCHEC (Clouage / Roi en danger)
      // ======================================================================
      if (game.in_check()) {
        if (piece.type === 'k') {
          return {
            type: 'error',
            title: `❌ Case ${to.toUpperCase()} sous le feu ennemi !`,
            text: `Votre Roi est en échec et vous tentez de le fuir en ${to.toUpperCase()}, mais cette case est elle aussi attaquée par une pièce adverse !`,
            rule: `📖 Règle FIDE : Le Roi n'a jamais le droit de se mettre ou de rester sur une case contrôlée par l'adversaire.`
          };
        }
        return {
          type: 'error',
          title: `⚠️ Priorité absolue : Votre Roi est en Échec ! (${moveLabel})`,
          text: `Le coup ${moveLabel} est géométriquement correct pour votre ${pieceLabel}, mais il est interdit car votre Roi reste en échec ! Vous devez obligatoirement sauver votre Roi.`,
          rule: `📖 Les 3 parades à l'échec : 1) Déplacer le Roi, 2) Capturer la pièce attaquante, ou 3) Interposer une pièce entre l'attaquant et votre Roi.`
        };
      } else {
        if (piece.type === 'k') {
          return {
            type: 'error',
            title: `❌ Suicide du Roi interdit en ${to.toUpperCase()} !`,
            text: `Vous ne pouvez pas déplacer votre Roi sur la case ${to.toUpperCase()} car cette case est directement menacée par une pièce adverse.`,
            rule: `📖 Règle Absolue FIDE : Il est strictement interdit de mettre son propre Roi en échec.`
          };
        }
        return {
          type: 'error',
          title: `📌 Pièce Clouée : Votre Roi serait mis en Échec ! (${moveLabel})`,
          text: `Votre ${pieceLabel} en ${from.toUpperCase()} protège actuellement votre Roi comme un bouclier. Si vous la déplacez en ${to.toUpperCase()}, une pièce adverse (Tour, Fou ou Dame) capturerait votre Roi !`,
          rule: `📖 Concept Tactique : C'est ce qu'on appelle un « Clouage Absolu ». Une pièce clouée sur le Roi ne peut pas quitter la ligne d'attaque.`
        };
      }
    }

    explainIllegalCastling(game, kingPiece, from, to, df) {
      const sideLabel = df > 0 ? 'Petit Roque (côté Roi)' : 'Grand Roque (côté Dame)';
      if (game.in_check()) {
        return {
          type: 'error',
          title: `❌ ${sideLabel} impossible : Roi en Échec !`,
          text: `Vous ne pouvez pas roquer pour fuir un échec. Le Roque est interdit lorsque votre Roi est actuellement attaqué.`,
          rule: `📖 Règle du Roque : Parez d'abord l'échec sans bouger le Roi si vous souhaitez roquer plus tard.`
        };
      }

      const rank = kingPiece.color === 'w' ? '1' : '8';
      const rookSq = (df > 0 ? 'h' : 'a') + rank;
      const rookPiece = game.get(rookSq);
      if (!rookPiece || rookPiece.type !== 'r' || rookPiece.color !== kingPiece.color) {
        return {
          type: 'error',
          title: `❌ ${sideLabel} impossible : Tour absente`,
          text: `La Tour nécessaire au roque n'est plus sur sa case initiale (${rookSq.toUpperCase()}).`,
          rule: `📖 Règle du Roque : Le Roi et la Tour concernée ne doivent jamais avoir bougé depuis le début de la partie.`
        };
      }

      // Vérifier si une pièce bloque entre le Roi et la Tour
      const blocker = this.findBlockingPiece(game, FILES.indexOf(from[0]), parseInt(rank, 10), FILES.indexOf(rookSq[0]), parseInt(rank, 10));
      if (blocker) {
        return {
          type: 'error',
          title: `❌ ${sideLabel} bloqué par ${PIECE_NAMES_FR[blocker.piece.type]} en ${blocker.square.toUpperCase()}`,
          text: `Toutes les cases situées entre votre Roi et votre Tour doivent être totalement vides pour pouvoir roquer.`,
          rule: `📖 Conseil : Développez d'abord la pièce située en ${blocker.square.toUpperCase()} au prochain coup !`
        };
      }

      return {
        type: 'error',
        title: `❌ ${sideLabel} interdit par les règles FIDE`,
        text: `Soit votre Roi ou votre Tour a déjà bougé plus tôt dans la partie, soit l'une des cases traversées par le Roi est contrôlée par une pièce adverse.`,
        rule: `📖 Règle du Roque : Le Roi ne peut ni partir d'un échec, ni traverser une case attaquée, ni arriver sur une case en échec.`
      };
    }

    findBlockingPiece(game, f1, r1, f2, r2) {
      const stepF = Math.sign(f2 - f1);
      const stepR = Math.sign(r2 - r1);
      let currF = f1 + stepF;
      let currR = r1 + stepR;

      while (currF !== f2 || currR !== r2) {
        const sq = FILES[currF] + currR;
        const p = game.get(sq);
        if (p) {
          return { square: sq, piece: p };
        }
        currF += stepF;
        currR += stepR;
      }
      return null;
    }

    /**
     * Commente positivement un coup légal réussi pour encourager l'apprenti
     */
    getMoveSuccessFeedback(moveResult, game) {
      const pieceTitle = PIECE_TITLES_FR[moveResult.piece];
      const moveStr = `${moveResult.from.toUpperCase()} → ${moveResult.to.toUpperCase()}`;

      if (game.in_checkmate()) {
        return {
          type: 'success',
          title: `🏆 Échec et Mat magistral (${moveResult.san}) !`,
          text: `Le Roi adverse est attaqué et ne dispose plus d'aucune case de fuite ni de parade. La partie est gagnée !`,
          rule: `🎓 Félicitations : Vous maîtrisez parfaitement l'attaque finale.`
        };
      }

      if (game.in_check()) {
        return {
          type: 'success',
          title: `⚔️ Échec au Roi ! (${moveResult.san})`,
          text: `Votre ${pieceTitle} en ${moveResult.to.toUpperCase()} attaque directement le Roi adverse ! L'adversaire est obligé de défendre son Roi immédiatement.`,
          rule: `📖 Règle : Un échec force la réponse adverse.`
        };
      }

      if (moveResult.flags.includes('e')) {
        return {
          type: 'success',
          title: `⚡ Superbe Prise en Passant (${moveResult.san}) !`,
          text: `Vous avez capturé le pion adverse qui venait d'avancer de 2 cases comme s'il n'avait avancé que d'une seule case.`,
          rule: `🎓 Règle d'Expert : La prise en passant est l'un des coups les plus subtils des échecs FIDE !`
        };
      }

      if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
        const castleType = moveResult.flags.includes('k') ? 'Petit Roque (O-O)' : 'Grand Roque (O-O-O)';
        return {
          type: 'success',
          title: `🏰 ${castleType} exécuté avec succès !`,
          text: `Excellent coup stratégique : votre Roi est désormais à l'abri dans l'angle et votre Tour entre en jeu au centre.`,
          rule: `💡 Principe d'ouverture : Roquer tôt protège le Roi et connecte vos Tours.`
        };
      }

      if (moveResult.flags.includes('p')) {
        return {
          type: 'success',
          title: `👑 Promotion du Pion en ${PIECE_TITLES_FR[moveResult.promotion]} (${moveResult.san}) !`,
          text: `Votre pion a traversé tout l'échiquier jusqu'à la dernière rangée et s'est transformé en ${PIECE_TITLES_FR[moveResult.promotion]} !`,
          rule: `📖 Puissance : Une promotion change souvent le destin de la partie.`
        };
      }

      if (moveResult.captured) {
        return {
          type: 'success',
          title: `🎯 Capture réussie avec ${PIECE_NAMES_FR[moveResult.piece]} (${moveResult.san})`,
          text: `Déplacement ${moveStr} : vous avez capturé ${PIECE_NAMES_FR[moveResult.captured]} adverse (+${Math.round(PIECE_VALUES[moveResult.captured] / 100)} pt${PIECE_VALUES[moveResult.captured] > 100 ? 's' : ''}).`,
          rule: `💡 Conseil : Vérifiez toujours si votre pièce est protégée après une capture.`
        };
      }

      // Contrôle du centre en début de partie
      if (['d4', 'e4', 'd5', 'e5'].includes(moveResult.to) && moveResult.piece === 'p') {
        return {
          type: 'success',
          title: `✅ Excellent coup de Pion central (${moveResult.san})`,
          text: `Occuper le centre (${moveResult.to.toUpperCase()}) avec vos pions libère les diagonales de vos Fous et contrôle les cases clés.`,
          rule: `📖 Principe d'or : Qui contrôle le centre contrôle la partie.`
        };
      }

      return {
        type: 'info',
        title: `✅ Coup joué : ${pieceTitle} ${moveStr} (Notation : ${moveResult.san})`,
        text: `Mouvement régulier conforme aux règles FIDE. Observez la réponse de votre adversaire.`,
        rule: `📖 Astuce : Développez vos Cavaliers et vos Fous avant de sortir la Dame.`
      };
    }
  }

  // --------------------------------------------------------------------------
  // 4. Moteur IA MiniMax avec Élagage Alpha-Bêta
  // --------------------------------------------------------------------------
  class ChessAI {
    constructor() {
      this.depth = 2;
    }

    evaluate(game, depthRemaining = 0) {
      if (game.in_checkmate()) {
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
          if (beta <= alpha) break;
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
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    getBestMove(game, depth = 2) {
      const rawMoves = game.moves({ verbose: true });
      if (!rawMoves || rawMoves.length === 0) return null;

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
  // 5. Contrôleur Principal du Jeu
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
      this.coach = new ApprenticeCoach();

      this.mode = 'ai'; // 'ai' ou 'pvp'
      this.aiDifficulty = 2;
      this.aiColor = 'b'; // L'humain joue 'w', l'IA joue 'b'
      this.isFlipped = false;
      this.themeIndex = 0;
      this.coachEnabled = true; // Guide Apprenti activé par défaut

      this.selectedSquare = null;
      this.legalMovesFromSquare = [];
      this.lastMove = null;
      this.hintMove = null; // Coup conseillé par le Guide Apprenti
      this.pendingPromotion = null;
      this.isAiThinking = false;
      this.aiTimer = null;
      this.toastTimer = null;
      this.illegalAnimTimer = null;

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
        btnCoachToggle: document.getElementById('btn-coach-toggle'),
        coachPanel: document.getElementById('coach-panel'),
        coachIcon: document.getElementById('coach-icon'),
        coachMsgTitle: document.getElementById('coach-msg-title'),
        coachMsgText: document.getElementById('coach-msg-text'),
        coachRuleTag: document.getElementById('coach-rule-tag'),
        btnHint: document.getElementById('btn-hint'),
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

      if (this.mode === 'ai' && this.aiColor === 'w') {
        this.triggerAiMove();
      }
    }

    // ------------------------------------------------------------------------
    // Préférences Utilisateur & Panneau Guide Apprenti
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
        const savedCoach = localStorage.getItem('chess_coach');
        if (savedCoach !== null) {
          this.coachEnabled = savedCoach === 'true';
          this.syncCoachToggleUI();
        }
      } catch (e) {
        // Ignorer
      }
    }

    savePreferences() {
      try {
        localStorage.setItem('chess_sound', String(this.audio.enabled));
        localStorage.setItem('chess_theme_idx', String(this.themeIndex));
        localStorage.setItem('chess_coach', String(this.coachEnabled));
      } catch (e) {
        // Ignorer
      }
    }

    syncCoachToggleUI() {
      if (!this.dom.btnCoachToggle || !this.dom.coachPanel) return;
      this.dom.btnCoachToggle.classList.toggle('active', this.coachEnabled);
      const labelEl = this.dom.btnCoachToggle.querySelector('.coach-badge-label');
      if (labelEl) {
        labelEl.textContent = `Guide Apprenti : ${this.coachEnabled ? 'ON' : 'OFF'}`;
      }
      this.dom.coachPanel.classList.toggle('hidden', !this.coachEnabled);
    }

    toggleCoachMode() {
      this.coachEnabled = !this.coachEnabled;
      this.syncCoachToggleUI();
      this.savePreferences();
      this.showToast(this.coachEnabled ? '🎓 Guide d\'Aide Apprenti activé' : '🎓 Guide d\'Aide Apprenti masqué');
    }

    updateCoachMessage({ type = 'info', title, text, rule }) {
      if (!this.dom.coachPanel) return;
      this.dom.coachPanel.classList.remove('coach-error', 'coach-success');
      if (type === 'error') {
        this.dom.coachPanel.classList.add('coach-error');
        if (this.dom.coachIcon) this.dom.coachIcon.textContent = '⚠️';
      } else if (type === 'success') {
        this.dom.coachPanel.classList.add('coach-success');
        if (this.dom.coachIcon) this.dom.coachIcon.textContent = '🌟';
      } else {
        if (this.dom.coachIcon) this.dom.coachIcon.textContent = '🎓';
      }

      if (this.dom.coachMsgTitle && title) this.dom.coachMsgTitle.textContent = title;
      if (this.dom.coachMsgText && text) this.dom.coachMsgText.textContent = text;
      if (this.dom.coachRuleTag && rule) this.dom.coachRuleTag.textContent = rule;
    }

    triggerIllegalMoveFeedback(fromSquare, targetSquare, explanation) {
      this.audio.playError();

      if (explanation) {
        this.updateCoachMessage(explanation);
      }

      // Animation visuelle sur la case cible refusée et la case de départ
      const targetEl = this.dom.board.querySelector(`.square[data-square="${targetSquare}"]`);
      const fromEl = this.dom.board.querySelector(`.square[data-square="${fromSquare}"]`);

      if (this.illegalAnimTimer) {
        clearTimeout(this.illegalAnimTimer);
      }

      if (targetEl) {
        targetEl.classList.remove('illegal-target', 'illegal-shake');
        void targetEl.offsetWidth; // Force reflow
        targetEl.classList.add('illegal-target', 'illegal-shake');
      }
      if (fromEl) {
        fromEl.classList.remove('illegal-shake');
        void fromEl.offsetWidth;
        fromEl.classList.add('illegal-shake');
      }

      this.illegalAnimTimer = setTimeout(() => {
        if (targetEl) targetEl.classList.remove('illegal-target', 'illegal-shake');
        if (fromEl) fromEl.classList.remove('illegal-shake');
      }, 950);
    }

    askCoachHint() {
      if (this.isAiThinking || this.game.game_over()) return;

      const bestMove = this.ai.getBestMove(this.game, 3);
      if (!bestMove) return;

      this.hintMove = { from: bestMove.from, to: bestMove.to };
      this.selectedSquare = bestMove.from;
      this.legalMovesFromSquare = this.game.moves({ square: bestMove.from, verbose: true });
      this.render();

      const pieceTitle = PIECE_TITLES_FR[bestMove.piece];
      let reason = `Ce coup améliore la position de votre ${pieceTitle} et contrôle des cases stratégiques.`;
      if (bestMove.captured) {
        reason = `Ce coup vous permet de capturer ${PIECE_NAMES_FR[bestMove.captured]} adverse en ${bestMove.to.toUpperCase()} !`;
      } else if (bestMove.flags && (bestMove.flags.includes('k') || bestMove.flags.includes('q'))) {
        reason = `Roquer maintenant met votre Roi en sécurité tout en activant votre Tour.`;
      } else if (['d4', 'e4', 'd5', 'e5'].includes(bestMove.to)) {
        reason = `Ce coup prend le contrôle du centre de l'échiquier, une zone clé en début de partie.`;
      }

      this.updateCoachMessage({
        type: 'success',
        title: `💡 Conseil du Maître : Jouez ${pieceTitle} ${bestMove.from.toUpperCase()} → ${bestMove.to.toUpperCase()} (${bestMove.san})`,
        text: reason,
        rule: `🟢 Les cases ${bestMove.from.toUpperCase()} et ${bestMove.to.toUpperCase()} sont mises en évidence en vert sur l'échiquier.`
      });
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
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

      const displayRanks = this.isFlipped ? [...ranks].reverse() : ranks;
      const displayFiles = this.isFlipped ? [...FILES].reverse() : FILES;

      this.dom.coordsRank.innerHTML = '';
      displayRanks.forEach(r => {
        const span = document.createElement('span');
        span.textContent = r;
        this.dom.coordsRank.appendChild(span);
      });

      this.dom.coordsFile.innerHTML = '';
      displayFiles.forEach(f => {
        const span = document.createElement('span');
        span.textContent = f.toUpperCase();
        this.dom.coordsFile.appendChild(span);
      });

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const rank = displayRanks[r];
          const file = displayFiles[c];
          const squareName = file + rank;

          const squareEl = document.createElement('div');
          squareEl.className = 'square';
          squareEl.dataset.square = squareName;

          const fileIdx = FILES.indexOf(file);
          const rankIdx = parseInt(rank, 10);
          const isLight = (fileIdx + rankIdx) % 2 === 0;
          squareEl.classList.add(isLight ? 'light' : 'dark');

          squareEl.addEventListener('click', (e) => this.handleSquareClick(squareName, e));
          squareEl.addEventListener('dragover', (e) => this.handleDragOver(e));
          squareEl.addEventListener('drop', (e) => this.handleDrop(squareName, e));

          this.dom.board.appendChild(squareEl);
        }
      }
    }

    render() {
      const kingSquareInCheck = this.game.in_check() ? this.getKingSquare(this.game.turn()) : null;

      const squares = this.dom.board.querySelectorAll('.square');
      squares.forEach(sq => {
        const sqName = sq.dataset.square;
        sq.innerHTML = '';
        const fileIdx = FILES.indexOf(sqName[0]);
        const rankIdx = parseInt(sqName[1], 10);
        const isLight = (fileIdx + rankIdx) % 2 === 0;
        sq.className = 'square ' + (isLight ? 'light' : 'dark');

        // Surbrillance du dernier coup
        if (this.lastMove && (sqName === this.lastMove.from || sqName === this.lastMove.to)) {
          sq.classList.add('last-move');
        }

        // Surbrillance d'un conseil du maître (Hint)
        if (this.hintMove) {
          if (sqName === this.hintMove.from) sq.classList.add('coach-hint-from');
          if (sqName === this.hintMove.to) sq.classList.add('coach-hint-to');
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
          const isCapture = Boolean(
            legalMove.captured ||
            (legalMove.flags && (legalMove.flags.includes('c') || legalMove.flags.includes('e')))
          );
          sq.classList.add(isCapture ? 'hint-capture' : 'hint-move');
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

          pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(sqName, e));
          pieceEl.addEventListener('dragend', () => this.handleDragEnd());

          sq.appendChild(pieceEl);
        }
      });

      this.updateStatusAndUI();
    }

    getKingSquare(color) {
      const board = this.game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === 'k' && p.color === color) {
            return FILES[c] + (8 - r);
          }
        }
      }
      return null;
    }

    // ------------------------------------------------------------------------
    // Gestion des interactions utilisateur & Diagnostic Pédagogique
    // ------------------------------------------------------------------------
    handleSquareClick(squareName, event) {
      if (this.isAiThinking || this.game.game_over()) return;

      const currentTurn = this.game.turn();
      const isPlayerTurn = (this.mode === 'pvp') || (currentTurn !== this.aiColor);
      if (!isPlayerTurn) return;

      const clickedPiece = this.game.get(squareName);

      // Si une pièce est déjà sélectionnée
      if (this.selectedSquare) {
        // Clic sur la même case : désélectionner
        if (this.selectedSquare === squareName) {
          this.clearSelection();
          return;
        }

        // 1. Vérifier si le coup vers `squareName` est légal
        const legalMove = this.legalMovesFromSquare.find(m => m.to === squareName);
        if (legalMove) {
          this.executeMoveWithPromotionCheck(this.selectedSquare, squareName);
          this.clearSelection();
          return;
        }

        // 2. Clic sur une autre pièce de sa propre couleur : changer de pièce sélectionnée
        if (clickedPiece && clickedPiece.color === currentTurn) {
          this.selectSquare(squareName);
          return;
        }

        // 3. TENTATIVE DE COUP ILLÉGAL (Case vide non autorisée ou pièce adverse non prenable)
        // Expliquer précisément à l'apprenti pourquoi ce déplacement est faux !
        const explanation = this.coach.explainIllegalMove(this.game, this.selectedSquare, squareName);
        this.triggerIllegalMoveFeedback(this.selectedSquare, squareName, explanation);
        return;
      } else {
        // Aucune case sélectionnée : clic sur une pièce
        if (clickedPiece) {
          if (clickedPiece.color === currentTurn) {
            this.selectSquare(squareName);
          } else {
            // Clic sur une pièce adverse alors qu'aucune pièce alliée n'est sélectionnée
            const turnLabel = currentTurn === 'w' ? 'Blancs' : 'Noirs';
            this.triggerIllegalMoveFeedback(squareName, squareName, {
              type: 'error',
              title: `⏳ Ce n'est pas le tour de cette pièce (${squareName.toUpperCase()})`,
              text: `Vous avez cliqué sur ${PIECE_NAMES_FR[clickedPiece.type]} adverse. C'est actuellement le trait aux ${turnLabel}.`,
              rule: `📖 Pour capturer cette pièce, sélectionnez d'abord l'une de vos pièces (${turnLabel}).`
            });
          }
        }
      }
    }

    selectSquare(squareName) {
      this.hintMove = null;
      this.selectedSquare = squareName;
      this.legalMovesFromSquare = this.game.moves({
        square: squareName,
        verbose: true
      });
      this.render();

      // Afficher l'aide de déplacement de la pièce sélectionnée dans le Guide Apprenti
      const piece = this.game.get(squareName);
      if (piece) {
        const guide = this.coach.getSelectionGuide(piece, squareName, this.legalMovesFromSquare.length);
        this.updateCoachMessage(guide);
      }
    }

    clearSelection() {
      this.selectedSquare = null;
      this.legalMovesFromSquare = [];
      this.render();
    }

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

      this.hintMove = null;
      this.selectedSquare = squareName;
      this.legalMovesFromSquare = this.game.moves({
        square: squareName,
        verbose: true
      });

      event.dataTransfer.setData('text/plain', squareName);
      event.dataTransfer.effectAllowed = 'move';
      event.target.classList.add('dragging');

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

      const guide = this.coach.getSelectionGuide(piece, squareName, this.legalMovesFromSquare.length);
      this.updateCoachMessage(guide);
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
        this.clearSelection();
      } else {
        // Le joueur a glissé-déposé la pièce sur une case ILLÉGALE -> Expliquer la cause !
        const explanation = this.coach.explainIllegalMove(this.game, fromSquare, targetSquare);
        this.triggerIllegalMoveFeedback(fromSquare, targetSquare, explanation);
      }
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

      this.hintMove = null;
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

      // Retour pédagogique dans le Guide Apprenti
      const feedback = this.coach.getMoveSuccessFeedback(moveResult, this.game);
      this.updateCoachMessage(feedback);

      this.render();

      if (this.game.game_over()) {
        this.showGameOverModal();
        return true;
      }

      if (this.mode === 'ai' && this.game.turn() === this.aiColor) {
        this.triggerAiMove();
      }

      return true;
    }

    // ------------------------------------------------------------------------
    // Tour de l'IA
    // ------------------------------------------------------------------------
    triggerAiMove() {
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
      }

      this.isAiThinking = true;
      this.updateStatusAndUI();

      const thinkDelay = this.aiDifficulty === 3 ? 340 : 250;

      this.aiTimer = setTimeout(() => {
        this.aiTimer = null;
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
    // Annulation de coup (Undo)
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
        if (this.aiColor === 'w' && historyLen <= 1) {
          this.showToast('C\'est déjà à votre tour de jouer le premier coup des Noirs !');
          return;
        }

        if (this.game.turn() === humanColor && historyLen >= 2) {
          this.game.undo();
          this.game.undo();
        } else {
          this.game.undo();
        }
      } else {
        this.game.undo();
      }

      this.dom.modalGameOver.classList.add('hidden');
      this.hintMove = null;

      const history = this.game.history({ verbose: true });
      if (history.length > 0) {
        const prev = history[history.length - 1];
        this.lastMove = { from: prev.from, to: prev.to };
      } else {
        this.lastMove = null;
      }

      this.clearSelection();
      this.updateCoachMessage({
        type: 'info',
        title: '↩️ Coup annulé',
        text: 'Vous êtes revenu à la position précédente. Prenez le temps d\'analyser vos options ou cliquez sur « 💡 Conseil ».',
        rule: '📖 L\'apprentissage passe par l\'expérimentation !'
      });

      if (this.mode === 'ai' && this.game.turn() === this.aiColor && !this.game.game_over()) {
        this.triggerAiMove();
      }
    }

    // ------------------------------------------------------------------------
    // Mise à jour de l'Interface Utilisateur
    // ------------------------------------------------------------------------
    updateStatusAndUI() {
      const turn = this.game.turn();
      const inCheck = this.game.in_check();
      const gameOver = this.game.game_over();

      const topColor = this.isFlipped ? 'w' : 'b';
      const bottomColor = this.isFlipped ? 'b' : 'w';

      const isTopActive = (turn === topColor && !gameOver);
      const isBottomActive = (turn === bottomColor && !gameOver);

      this.dom.playerTop.classList.toggle('active-turn', isTopActive);
      this.dom.playerBottom.classList.toggle('active-turn', isBottomActive);

      if (this.dom.avatarTop) {
        this.dom.avatarTop.textContent = (topColor === 'w') ? '♙' : '♟️';
      }
      if (this.dom.avatarBottom) {
        this.dom.avatarBottom.textContent = (bottomColor === 'w') ? '♙' : '♟️';
      }

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

      this.updateCapturedAndAdvantage();
      this.updateHistoryTable();
    }

    updateCapturedAndAdvantage() {
      const verboseHistory = this.game.history({ verbose: true });
      const capturedByWhite = [];
      const capturedByBlack = [];

      verboseHistory.forEach(move => {
        if (move.captured) {
          if (move.color === 'w') {
            capturedByWhite.push({ color: 'b', type: move.captured });
          } else {
            capturedByBlack.push({ color: 'w', type: move.captured });
          }
        }
      });

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

      const topColor = this.isFlipped ? 'w' : 'b';
      const topCaptured = (topColor === 'w') ? capturedByWhite : capturedByBlack;
      const bottomCaptured = (topColor === 'w') ? capturedByBlack : capturedByWhite;

      this.renderCapturedList(this.dom.capturedTop, topCaptured);
      this.renderCapturedList(this.dom.capturedBottom, bottomCaptured);

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
      this.hintMove = null;
      this.pendingPromotion = null;
      this.isAiThinking = false;
      this.dom.modalGameOver.classList.add('hidden');
      this.dom.modalPromotion.classList.add('hidden');

      this.updateCoachMessage({
        type: 'info',
        title: '🎓 Nouvelle Partie - Guide Apprenti prêt !',
        text: 'Sélectionnez une pièce pour voir ses déplacements possibles. Si vous tentez un déplacement interdit (avec un pion ou une autre pièce), je vous expliquerai pourquoi !',
        rule: '📖 Règle FIDE : Contrôlez le centre avec vos pions (e4 ou d4) et développez vos pièces.'
      });

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
      this.dom.btnNewGame.addEventListener('click', () => this.resetGame());
      this.dom.btnUndo.addEventListener('click', () => this.undoMove());
      this.dom.btnFlip.addEventListener('click', () => this.flipBoard());
      this.dom.btnSound.addEventListener('click', () => this.toggleSound());
      this.dom.btnTheme.addEventListener('click', () => this.cycleTheme());

      if (this.dom.btnCoachToggle) {
        this.dom.btnCoachToggle.addEventListener('click', () => this.toggleCoachMode());
      }
      if (this.dom.btnHint) {
        this.dom.btnHint.addEventListener('click', () => this.askCoachHint());
      }

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

      // Modale Promotion
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

      // Raccourcis clavier
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
        } else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'SELECT') {
          this.askCoachHint();
        }
      });
    }
  }

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
