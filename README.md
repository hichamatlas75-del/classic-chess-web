# ♟️ Échecs Classiques (Classic Chess Web)

Une application web complète, moderne, fluide et responsive du **Jeu d'Échecs Classique**, respectant scrupuleusement l'ensemble des règles officielles de la Fédération Internationale des Échecs (**FIDE**), développée en Vanilla JavaScript ES6+ sans framework lourd.

Accessible et jouable directement en ligne sur n'importe quel navigateur (desktop, tablette et smartphone).

---

## 🌐 Liens Rapides

- **🎮 Jouer en direct (GitHub Pages) :** [https://hichamatlas75-del.github.io/classic-chess-web/](https://hichamatlas75-del.github.io/classic-chess-web/)
- **📦 Dépôt GitHub :** [https://github.com/hichamatlas75-del/classic-chess-web](https://github.com/hichamatlas75-del/classic-chess-web)

---

## ✨ Fonctionnalités & Règles Officielles FIDE

### 1. Moteur & Règles du Jeu
- **Déplacements officiels FIDE complets :**
  - **Roi :** déplacement d'une case dans toutes les directions.
  - **Dame :** liberté totale en ligne, colonne et diagonale.
  - **Tours & Fous :** déplacements orthogonaux et diagonaux sans saut.
  - **Cavaliers :** saut en « L » (2 cases + 1 perpendiculaire).
  - **Pions :** avance d'une case (ou deux cases au coup initial), capture en diagonale.
- **Règles spéciales intégrées :**
  - 🏰 **Le Roque :** Petit roque ($O-O$) et Grand roque ($O-O-O$) avec validation stricte de l'absence de déplacement antérieur du Roi et de la Tour, d'obstacles entre les pièces et d'absence d'attaque sur les cases traversées.
  - ⚡ **La Prise en Passant :** détection du déplacement initial de 2 cases du pion adverse et possibilité de capture immédiate au coup suivant.
  - 👑 **Promotion du Pion :** déclenchement d'une modale intuitive permettant de promouvoir le pion en Dame, Tour, Fou ou Cavalier.
- **Détection des états de partie :**
  - ⚠️ **Échec au Roi :** mise en surbrillance rouge dynamique et signal sonore d'alerte.
  - 🏆 **Échec et Mat :** arrêt de la partie et annonce officielle du vainqueur.
  - 🤝 **Pat (Match Nul) :** détection immédiate de l'absence de coup légal sans échec.
  - 🔄 **Nulle par Triple Répétition & Règle des 50 coups.**
  - ⚖️ **Nulle par Matériel Insuffisant.**
  - 🚫 **Interdiction absolue** de jouer un coup laissant son propre roi en échec.

### 2. Interface Utilisateur & Ergonomie
- **Graphismes vectoriels SVG haute fidélité :**
  - Pièces Staunton classiques vectorielles nettes sur tous les écrans (Retina, 4K).
  - Échiquier vectoriel avec coordonnées algébriques (A-H, 1-8).
  - 3 thèmes d'échiquier interchangeables en un clic : **Tournoi Lichess**, **Bois Traditionnel** et **Ardoise Moderne**.
- **Indicateurs visuels clairs :**
  - Case sélectionnée mise en évidence.
  - Points discrets pour les déplacements possibles et anneaux pour les captures cibles.
  - Surbrillance du dernier coup joué (case de départ et d'arrivée).
- **Modes de Jeu :**
  - 🤖 **Solo contre IA :** Moteur heuristique MiniMax avec élagage Alpha-Bêta ($\alpha$-$\beta$), tables positionnelles PeSTO pour chaque type de pièce et 3 niveaux de difficulté (Débutant, Intermédiaire, Avancé). Choix de la couleur jouée (Blancs ou Noirs).
  - 👥 **2 Joueurs en Local :** alternance des coups sur le même écran avec bandeau joueur dynamique.
- **Outils & Confort de jeu :**
  - 🔄 **Tourner l'échiquier :** retournement fluide à 180° avec mise à jour des coordonnées.
  - ↩️ **Annuler le coup (Undo) :** retour en arrière instantané (annule le coup du joueur et de l'IA en mode solo).
  - 📜 **Historique des coups :** notation algébrique standard (SAN : ex. `e4`, `Nf3`, `O-O`) avec défilement automatique.
  - ⚔️ **Pièces capturées & Avantage matériel :** décompte en temps réel des pièces sorties et affichage du différentiel (ex. `+3`).
  - ⏱️ **Pendule / Horloge d'Échecs Digitale :** cadences officielles FIDE (Blitz 3 min, 5 min, Rapide 10 min, Compétition 15 min + 10s d'incrément, Classique 30 min, ou Chronomètre libre illimité). Gestion stricte de la défaite au temps et nulle en cas de matériel insuffisant.
  - 👁️ **Mode Anti-Veille (Screen Wake Lock API) :** empêche automatiquement la mise en veille ou l'extinction de l'écran pendant vos parties sur smartphone, tablette ou ordinateur.
  - 📲 **Progressive Web App (PWA) :** installable en tant qu'application native sur Android, iOS, Windows et macOS avec support complet du jeu hors-ligne via Service Worker.
  - 🔊 **Effets sonores immersifs :** synthèse audio pure via Web Audio API (déplacement, capture, échec, alerte temps, victoire) sans téléchargement de fichiers lourds.
  - 📱 **Design 100% Responsive :** optimisé pour écrans tactiles mobiles (tap-to-move et drag & drop).

---

## 📁 Architecture du Projet

```
classic-chess-web/
├── index.html        # Structure sémantique HTML5, échiquier, pendules et modales
├── style.css         # Thème bois de luxe, pendule digitale DGT, responsive design
├── app.js            # Contrôleur de jeu, horloges d'échecs, anti-veille, moteur IA, coach
├── chess.js          # Moteur FIDE certifié (génération et validation des coups légaux)
├── pieces.js         # Intégration optimisée des 12 pièces SVG vectorielles
├── sw.js             # Service Worker PWA (mise en cache et fonctionnement hors-ligne)
├── manifest.json     # Manifeste PWA pour installation sur mobile et desktop
├── assets/
│   ├── icons/        # Icônes PWA haute résolution (192x192, 512x512, maskable, SVG)
│   └── pieces/       # Fichiers SVG individuels des pièces (cburnett Staunton)
└── README.md         # Documentation complète du projet
```

---

## 🚀 Installation & Exécution Locale

L'application ne nécessite aucun build ni dépendance complexe : un simple navigateur web suffit !

### Option 1 : Ouverture directe
Clonez le dépôt et ouvrez simplement `index.html` dans votre navigateur préféré :
```bash
git clone https://github.com/hichamatlas75-del/classic-chess-web.git
cd classic-chess-web
# Sous macOS :
open index.html
# Sous Linux :
xdg-open index.html
# Sous Windows :
start index.html
```

### Option 2 : Serveur HTTP local (recommandé)
Pour tester avec un mini serveur local :
```bash
# Avec Python 3 :
python3 -m http.server 8080

# Ou avec Node.js (npx) :
npx serve .
```
Ouvrez ensuite `http://localhost:8080` dans votre navigateur.

---

## 🧠 Fonctionnement de l'IA MiniMax

L'intelligence artificielle solo repose sur l'algorithme **MiniMax avec élagage Alpha-Bêta** :
1. **Évaluation matérielle :** Pion (100), Cavalier (320), Fou (330), Tour (500), Dame (900), Roi (20000).
2. **Tables Positionnelles (PeSTO / Simplified Evaluation) :** valorisation de la structure de pions, du contrôle du centre par les cavaliers, des diagonales ouvertes pour les fous, de la 7ème rangée pour les tours et de la sécurité du roi.
3. **Ordonnancement des coups (Move Ordering) :** priorisation des captures (heuristique MVV-LVA) et des promotions afin de maximiser le nombre de branches coupées par l'élagage alpha-bêta.
4. **Exécution asynchrone :** les calculs de l'IA sont différés avec un léger délai d'attente naturel afin de préserver la fluidité de l'interface utilisateur.

---

## 📜 Licence

Ce projet est sous licence libre **MIT**. Les pièces d'échecs vectorielles Staunton sont issues des travaux de Colin M.L. Burnett sous licence libre CC-BY-SA 3.0.
