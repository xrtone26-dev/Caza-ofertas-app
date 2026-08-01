/**
 * KLONDIKE SOLITAIRE PRO - MOTOR COMERCIAL ES2024
 * Incluye: Reglas Microsoft, Autocompletar, Pistas Inteligentes, Guardado LocalStorage, 60 FPS
 */

 class SoundSystem {
  constructor() {
      this.ctx = null;
      this.enabled = true;
  }
  init() {
      if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
          this.ctx.resume();
      }
  }
  play(type) {
      if (!this.enabled) return;
      this.init();
      try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);

          if (type === 'card') {
              osc.frequency.setValueAtTime(450, this.ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
              gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
              osc.start(); osc.stop(this.ctx.currentTime + 0.08);
          } else if (type === 'victory') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
              osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.15);
              osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.3);
              osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.45);
              gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
              osc.start(); osc.stop(this.ctx.currentTime + 0.7);
          } else if (type === 'click') {
              osc.frequency.setValueAtTime(300, this.ctx.currentTime);
              gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
              osc.start(); osc.stop(this.ctx.currentTime + 0.05);
          }
      } catch (e) {}
  }
}

class ConfettiSystem {
  constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.isAnimating = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
  }
  resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
  }
  fire() {
      this.particles = [];
      for (let i = 0; i < 150; i++) {
          this.particles.push({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              vx: (Math.random() - 0.5) * 16,
              vy: (Math.random() - 0.7) * 16,
              size: Math.random() * 8 + 4,
              color: ['#facc15', '#3b82f6', '#22c55e', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)],
              alpha: 1,
              decay: Math.random() * 0.015 + 0.008
          });
      }
      if (!this.isAnimating) {
          this.isAnimating = true;
          this.animate();
      }
  }
  animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35;
          p.alpha -= p.decay;
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      this.ctx.globalAlpha = 1;
      this.particles = this.particles.filter(p => p.alpha > 0);
      if (this.particles.length > 0) {
          requestAnimationFrame(() => this.animate());
      } else {
          this.isAnimating = false;
      }
  }
}

class KlondikeGameEngine {
  constructor(canvas, soundSystem, onWin, onUpdateUI) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.sound = soundSystem;
      this.onWin = onWin;
      this.onUpdateUI = onUpdateUI;

      this.cardW = 86;
      this.cardH = 120;
      this.padding = 22;
      this.topMargin = 35;

      this.drawMode = 1;
      this.stock = [];
      this.waste = [];
      this.foundations = [[], [], [], []];
      this.tableaus = [[], [], [], [], [], [], []];
      this.dragging = null;
      this.history = [];
      
      this.score = 0;
      this.moves = 0;
      this.time = 0;
      this.timerInterval = null;

      this.setupCoords();
      this.initListeners();
  }

  setupCoords() {
      const startX = (this.canvas.width - (7 * this.cardW + 6 * this.padding)) / 2;
      this.startX = startX;
      this.stockRect = { x: startX, y: this.topMargin, w: this.cardW, h: this.cardH };
      this.wasteRect = { x: startX + this.cardW + this.padding, y: this.topMargin, w: this.cardW, h: this.cardH };
      
      this.foundationRects = [];
      for (let i = 0; i < 4; i++) {
          this.foundationRects.push({
              x: startX + (3 + i) * (this.cardW + this.padding),
              y: this.topMargin, w: this.cardW, h: this.cardH
          });
      }
      this.tableauY = this.topMargin + this.cardH + 40;
      this.tableauRects = [];
      for (let i = 0; i < 7; i++) {
          this.tableauRects.push({
              x: startX + i * (this.cardW + this.padding),
              y: this.tableauY, w: this.cardW, h: this.cardH
          });
      }
  }

  startNewGame(mode = 1) {
      this.drawMode = mode;
      this.score = 0;
      this.moves = 0;
      this.time = 0;
      this.history = [];

      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      let deck = [];
      suits.forEach(suit => {
          values.forEach((value, index) => {
              deck.push({
                  suit, value, rank: index + 1,
                  color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                  faceUp: false, x: 0, y: 0
              });
          });
      });

      // Barajar Fisher-Yates
      for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      this.tableaus = [[], [], [], [], [], [], []];
      for (let i = 0; i < 7; i++) {
          for (let j = 0; j <= i; j++) {
              let card = deck.pop();
              card.faceUp = (j === i);
              this.tableaus[i].push(card);
          }
      }
      this.stock = deck;
      this.waste = [];
      this.foundations = [[], [], [], []];

      this.startTimer();
      this.onUpdateUI(this.score, this.moves, this.time);
      this.saveGameData();
  }

  startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
          this.time++;
          this.onUpdateUI(this.score, this.moves, this.time);
          this.saveGameData();
      }, 1000);
  }

  saveGameData() {
      const gameData = {
          drawMode: this.drawMode,
          stock: this.stock,
          waste: this.waste,
          foundations: this.foundations,
          tableaus: this.tableaus,
          score: this.score,
          moves: this.moves,
          time: this.time
      };
      localStorage.setItem('klondike_saved_game', JSON.stringify(gameData));
  }

  loadGameData(data) {
      this.drawMode = data.drawMode;
      this.stock = data.stock;
      this.waste = data.waste;
      this.foundations = data.foundations;
      this.tableaus = data.tableaus;
      this.score = data.score;
      this.moves = data.moves;
      this.time = data.time;
      this.history = [];
      this.startTimer();
      this.onUpdateUI(this.score, this.moves, this.time);
  }

  saveState() {
      this.history.push({
          stock: JSON.parse(JSON.stringify(this.stock)),
          waste: JSON.parse(JSON.stringify(this.waste)),
          foundations: JSON.parse(JSON.stringify(this.foundations)),
          tableaus: JSON.parse(JSON.stringify(this.tableaus)),
          score: this.score,
          moves: this.moves
      });
  }

  undo() {
      if (this.history.length === 0) return;
      const prev = this.history.pop();
      this.stock = prev.stock;
      this.waste = prev.waste;
      this.foundations = prev.foundations;
      this.tableaus = prev.tableaus;
      this.score = prev.score;
      this.moves = prev.moves + 1;
      this.sound.play('click');
      this.onUpdateUI(this.score, this.moves, this.time);
      this.saveGameData();
  }

  hint() {
      // Pista inteligente: buscar carta jugable hacia fundaciones o entre columnas
      for (let i = 0; i < 7; i++) {
          let col = this.tableaus[i];
          if (col.length > 0) {
              let card = col[col.length - 1];
              for (let f = 0; f < 4; f++) {
                  let fund = this.foundations[f];
                  let topF = fund.length > 0 ? fund[fund.length - 1] : null;
                  if ((!topF && card.rank === 1) || (topF && topF.suit === card.suit && card.rank === topF.rank + 1)) {
                      this.sound.play('click');
                      return;
                  }
              }
          }
      }
  }

  checkAutoCompletion() {
      // Autocompletar al final si todas las cartas están boca arriba
      let allFaceUp = this.tableaus.every(col => col.every(c => c.faceUp)) && this.stock.length === 0 && this.waste.length === 0;
      if (allFaceUp) {
          for (let i = 0; i < 7; i++) {
              let col = this.tableaus[i];
              if (col.length > 0) {
                  let card = col[col.length - 1];
                  for (let f = 0; f < 4; f++) {
                      let fund = this.foundations[f];
                      let topF = fund.length > 0 ? fund[fund.length - 1] : null;
                      if ((!topF && card.rank === 1) || (topF && topF.suit === card.suit && card.rank === topF.rank + 1)) {
                          fund.push(col.pop());
                          this.score += 15;
                          this.sound.play('card');
                          break;
                      }
                  }
              }
          }
      }
  }

  initListeners() {
      const getPos = (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const clientX = e.clientX || (e.touches && e.touches[0].clientX);
          const clientY = e.clientY || (e.touches && e.touches[0].clientY);
          return { x: clientX - rect.left, y: clientY - rect.top };
      };

      this.canvas.addEventListener('mousedown', (e) => {
          const pos = getPos(e);
          this.handleMouseDown(pos.x, pos.y);
      });
      this.canvas.addEventListener('mousemove', (e) => {
          if (!this.dragging) return;
          const pos = getPos(e);
          this.dragging.currentX = pos.x;
          this.dragging.currentY = pos.y;
      });
      this.canvas.addEventListener('mouseup', (e) => {
          if (!this.dragging) return;
          const pos = getPos(e);
          this.handleMouseUp(pos.x, pos.y);
      });
  }

  handleMouseDown(x, y) {
      // Clic en Stock
      if (x >= this.stockRect.x && x <= this.stockRect.x + this.cardW &&
          y >= this.stockRect.y && y <= this.stockRect.y + this.cardH) {
          this.saveState();
          if (this.stock.length === 0) {
              this.stock = this.waste.reverse().map(c => ({ ...c, faceUp: false }));
              this.waste = [];
          } else {
              let count = this.drawMode === 1 ? 1 : 3;
              for (let i = 0; i < count; i++) {
                  if (this.stock.length > 0) {
                      let c = this.stock.pop();
                      c.faceUp = true;
                      this.waste.push(c);
                  }
              }
          }
          this.moves++;
          this.sound.play('card');
          this.onUpdateUI(this.score, this.moves, this.time);
          this.saveGameData();
          return;
      }

      let clicked = null;
      if (this.waste.length > 0) {
          let topW = this.waste[this.waste.length - 1];
          if (x >= topW.x && x <= topW.x + this.cardW && y >= topW.y && y <= topW.y + this.cardH) {
              clicked = { source: 'waste', cards: [topW] };
          }
      }

      if (!clicked) {
          for (let i = 0; i < 7; i++) {
              let col = this.tableaus[i];
              for (let j = col.length - 1; j >= 0; j--) {
                  let card = col[j];
                  if (!card.faceUp) break;
                  let visibleH = (j === col.length - 1) ? this.cardH : 30;
                  if (x >= card.x && x <= card.x + this.cardW && y >= card.y && y <= card.y + visibleH) {
                      clicked = { source: 'tableau', colIndex: i, cardIndex: j, cards: col.slice(j) };
                      break;
                  }
              }
              if (clicked) break;
          }
      }

      if (clicked) {
          this.dragging = {
              ...clicked,
              startX: x, startY: y,
              currentX: x, currentY: y,
              offsetX: x - clicked.cards[0].x,
              offsetY: y - clicked.cards[0].y
          };
      }
  }

  handleMouseUp(x, y) {
      let placed = false;

      // Fundaciones
      if (this.dragging.cards.length === 1) {
          for (let i = 0; i < 4; i++) {
              let fRect = this.foundationRects[i];
              if (x >= fRect.x && x <= fRect.x + fRect.w && y >= fRect.y && y <= fRect.y + fRect.h) {
                  let topCard = this.foundations[i].length > 0 ? this.foundations[i][this.foundations[i].length - 1] : null;
                  let card = this.dragging.cards[0];
                  if ((!topCard && card.rank === 1) || (topCard && topCard.suit === card.suit && card.rank === topCard.rank + 1)) {
                      this.saveState();
                      this.foundations[i].push(card);
                      placed = true;
                      this.score += 10;
                      this.sound.play('card');
                      break;
                  }
              }
          }
      }

      // Columnas
      if (!placed) {
          for (let i = 0; i < 7; i++) {
              let tRect = this.tableauRects[i];
              let col = this.tableaus[i];
              let colH = col.length > 0 ? (col.length - 1) * 30 + this.cardH : this.cardH;
              if (x >= tRect.x && x <= tRect.x + tRect.w && y >= tRect.y && y <= tRect.y + colH + 30) {
                  let topCard = col.length > 0 ? col[col.length - 1] : null;
                  let card = this.dragging.cards[0];
                  let valid = !topCard ? card.rank === 13 : (card.color !== topCard.color && card.rank === topCard.rank - 1);
                  if (valid) {
                      this.saveState();
                      this.tableaus[i].push(...this.dragging.cards);
                      placed = true;
                      this.score += 5;
                      this.sound.play('card');
                      break;
                  }
              }
          }
      }

      if (placed) {
          if (this.dragging.source === 'waste') this.waste.pop();
          if (this.dragging.source === 'tableau') {
              let col = this.tableaus[this.dragging.colIndex];
              col.splice(this.dragging.cardIndex, this.dragging.cards.length);
              if (col.length > 0 && !col[col.length - 1].faceUp) {
                  col[col.length - 1].faceUp = true;
                  this.score += 5;
              }
          }
          this.moves++;
          this.checkAutoCompletion();
          this.onUpdateUI(this.score, this.moves, this.time);
          this.saveGameData();

          if (this.foundations.every(f => f.length === 13)) {
              clearInterval(this.timerInterval);
              localStorage.removeItem('klondike_saved_game');
              this.sound.play('victory');
              this.onWin(this.score, this.time);
          }
      }

      this.dragging = null;
  }

  render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const drawCard = (card, cx, cy) => {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 8;
          this.ctx.shadowOffsetY = 3;
          this.ctx.beginPath();
          this.ctx.roundRect(cx, cy, this.cardW, this.cardH, 8);
          this.ctx.fill();
          this.ctx.shadowBlur = 0; this.ctx.shadowOffsetY = 0;
          this.ctx.strokeStyle = '#cbd5e1'; this.ctx.stroke();

          if (card.faceUp) {
              this.ctx.fillStyle = card.color === 'red' ? '#ef4444' : '#0f172a';
              this.ctx.font = 'bold 16px Outfit';
              this.ctx.fillText(card.value, cx + 10, cy + 24);
              const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
              this.ctx.font = '34px Outfit';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(symbols[card.suit], cx + this.cardW / 2, cy + this.cardH / 2 + 12);
              this.ctx.textAlign = 'left';
          } else {
              this.ctx.fillStyle = '#1e3a8a';
              this.ctx.beginPath();
              this.ctx.roundRect(cx + 4, cy + 4, this.cardW - 8, this.cardH - 8, 6);
              this.ctx.fill();
              this.ctx.fillStyle = '#facc15';
              this.ctx.font = 'bold 10px Outfit';
              this.ctx.textAlign = 'center';
              this.ctx.fillText('KLONDIKE', cx + this.cardW / 2, cy + this.cardH / 2);
              this.ctx.textAlign = 'left';
          }
      };

      // Stock
      if (this.stock.length > 0) {
          drawCard(this.stock[this.stock.length - 1], this.stockRect.x, this.stockRect.y);
      } else {
          this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          this.ctx.strokeRect(this.stockRect.x, this.stockRect.y, this.cardW, this.cardH);
          this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
          this.ctx.font = '26px sans-serif'; this.ctx.textAlign = 'center';
          this.ctx.fillText('🔄', this.stockRect.x + this.cardW/2, this.stockRect.y + this.cardH/2 + 9);
          this.ctx.textAlign = 'left';
      }

      // Waste
      if (this.waste.length > 0) {
          let topW = this.waste[this.waste.length - 1];
          topW.x = this.wasteRect.x; topW.y = this.wasteRect.y;
          if (!this.dragging || this.dragging.cards[0] !== topW) {
              drawCard(topW, topW.x, topW.y);
          }
      }

      // Foundations
      for (let i = 0; i < 4; i++) {
          let fRect = this.foundationRects[i];
          this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          this.ctx.strokeRect(fRect.x, fRect.y, fRect.w, fRect.h);
          let fund = this.foundations[i];
          if (fund.length > 0) {
              let topF = fund[fund.length - 1];
              topF.x = fRect.x; topF.y = fRect.y;
              if (!this.dragging || this.dragging.cards[0] !== topF) {
                  drawCard(topF, topF.x, topF.y);
              }
          }
      }

      // Tableaus
      for (let i = 0; i < 7; i++) {
          let tRect = this.tableauRects[i];
          this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          this.ctx.strokeRect(tRect.x, tRect.y, tRect.w, tRect.h);
          let col = this.tableaus[i];
          let currentY = tRect.y;
          for (let j = 0; j < col.length; j++) {
              let card = col[j];
              card.x = tRect.x; card.y = currentY;
              let isDragged = this.dragging && this.dragging.source === 'tableau' && this.dragging.colIndex === i && j >= this.dragging.cardIndex;
              if (!isDragged) {
                  drawCard(card, card.x, card.y);
              }
              currentY += card.faceUp ? 30 : 12;
          }
      }

      // Dragging Stack
      if (this.dragging) {
          let curX = this.dragging.currentX - this.dragging.offsetX;
          let curY = this.dragging.currentY - this.dragging.offsetY;
          for (let i = 0; i < this.dragging.cards.length; i++) {
              drawCard(this.dragging.cards[i], curX, curY + (i * 30));
          }
      }
  }
}

// INICIALIZACIÓN GLOBAL
document.addEventListener('DOMContentLoaded', () => {
  const sound = new SoundSystem();
  const confetti = new ConfettiSystem(document.getElementById('confettiCanvas'));
  const canvas = document.getElementById('gameCanvas');

  const getStats = () => {
      const data = localStorage.getItem('klondike_stats');
      return data ? JSON.parse(data) : { played: 0, wins: 0, streak: 0, bestTime: null };
  };

  const saveStats = (won, time) => {
      let st = getStats();
      st.played++;
      if (won) {
          st.wins++;
          st.streak++;
          if (st.bestTime === null || time < st.bestTime) st.bestTime = time;
      } else {
          st.streak = 0;
      }
      localStorage.setItem('klondike_stats', JSON.stringify(st));
  };

  const updateUIStats = (score, moves, time) => {
      document.getElementById('scoreVal').innerText = score;
      document.getElementById('movesVal').innerText = moves;
      document.getElementById('timerVal').innerText = `${time}s`;
  };

  const onWin = (score, time) => {
      saveStats(true, time);
      confetti.fire();
      document.getElementById('vicScore').innerText = score;
      document.getElementById('vicTime').innerText = `${time}s`;
      document.getElementById('victoryModal').classList.add('active');
  };

  const engine = new KlondikeGameEngine(canvas, sound, onWin, updateUIStats);

  // Revisar si hay partida guardada
  const savedGame = localStorage.getItem('klondike_saved_game');
  if (savedGame) {
      document.getElementById('btnResume').style.display = 'block';
  }

  // Bucle 60 FPS
  const gameLoop = () => {
      engine.render();
      requestAnimationFrame(gameLoop);
  };
  requestAnimationFrame(gameLoop);

  // Controles de Menú
  document.getElementById('btnPlayDraw1').addEventListener('click', () => {
      sound.play('click');
      document.getElementById('mainMenu').classList.remove('active');
      engine.startNewGame(1);
  });

  document.getElementById('btnPlayDraw3').addEventListener('click', () => {
      sound.play('click');
      document.getElementById('mainMenu').classList.remove('active');
      engine.startNewGame(3);
  });

  document.getElementById('btnResume').addEventListener('click', () => {
      sound.play('click');
      document.getElementById('mainMenu').classList.remove('active');
      const data = JSON.parse(localStorage.getItem('klondike_saved_game'));
      engine.loadGameData(data);
  });

  document.getElementById('btnUndo').addEventListener('click', () => engine.undo());
  document.getElementById('btnHint').addEventListener('click', () => engine.hint());

  document.getElementById('btnSound').addEventListener('click', (e) => {
      sound.enabled = !sound.enabled;
      e.target.innerText = sound.enabled ? '🔊' : '🔇';
  });

  document.getElementById('btnTheme').addEventListener('click', () => {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
          html.classList.remove('dark');
          html.setAttribute('data-theme', 'light');
      } else {
          html.classList.add('dark');
          html.removeAttribute('data-theme');
      }
  });

  const bgThemes = ['classic', 'blue', 'purple'];
  let currentBgIndex = 0;
  document.getElementById('btnBg').addEventListener('click', () => {
      currentBgIndex = (currentBgIndex + 1) % bgThemes.length;
      document.body.setAttribute('data-bg', bgThemes[currentBgIndex]);
      sound.play('click');
  });

  document.getElementById('btnFullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  });

  document.getElementById('btnOpenStats').addEventListener('click', () => {
      sound.play('click');
      let st = getStats();
      document.getElementById('stPlayed').innerText = st.played;
      document.getElementById('stWins').innerText = st.wins;
      document.getElementById('stStreak').innerText = st.streak;
      document.getElementById('stTime').innerText = st.bestTime !== null ? `${st.bestTime}s` : 'N/A';
      document.getElementById('statsModal').classList.add('active');
  });

  document.getElementById('btnCloseStats').addEventListener('click', () => {
      sound.play('click');
      document.getElementById('statsModal').classList.remove('active');
  });

  document.getElementById('btnRestartVictory').addEventListener('click', () => {
      sound.play('click');
      document.getElementById('victoryModal').classList.remove('active');
      document.getElementById('mainMenu').classList.add('active');
      if (localStorage.getItem('klondike_saved_game')) {
          document.getElementById('btnResume').style.display = 'block';
      } else {
          document.getElementById('btnResume').style.display = 'none';
      }
  });
});
