/* =========================================================
   Battleships Online — game engine + UI
   Core logic (top section) is DOM-free so it can be
   self-checked with `node tests/test.js`.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Core game logic (no DOM) ---------- */

  var BOARD_SIZE = 10;
  var TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

  var FLEET = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
  ];

  function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  // Try to place one ship at a random position/orientation on an occupancy grid.
  // Returns array of cell indices, or null if no spot found after 200 tries.
  function placeShip(occupied, size) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var horizontal = randomInt(2) === 0;
      var row = randomInt(horizontal ? BOARD_SIZE : BOARD_SIZE - size + 1);
      var col = randomInt(horizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE);
      var cells = [];
      var fits = true;
      for (var i = 0; i < size; i++) {
        var r = horizontal ? row : row + i;
        var c = horizontal ? col + i : col;
        var idx = r * BOARD_SIZE + c;
        if (occupied[idx]) { fits = false; break; }
        cells.push(idx);
      }
      if (fits) return cells;
    }
    return null;
  }

  // Place the whole fleet randomly. Returns [{ name, size, cells, hits }]
  function createFleet() {
    var occupied = new Array(TOTAL_CELLS).fill(false);
    var ships = [];
    FLEET.forEach(function (ship) {
      var cells = placeShip(occupied, ship.size);
      // 200 random tries per ship on a 10x10 grid never fails in practice;
      // if it ever did we restart the whole placement rather than ship a broken fleet.
      if (!cells) return createFleet();
      cells.forEach(function (idx) { occupied[idx] = true; });
      ships.push({ name: ship.name, size: ship.size, cells: cells, hits: 0, sunk: false });
    });
    return ships;
  }

  // Register a shot against a fleet. Mutates the fleet's hit/sunk state.
  // Returns { result: 'hit' | 'miss' | 'sunk', ship: shipOrNull }
  function registerShot(ships, cellIndex) {
    var ship = ships.find(function (s) { return s.cells.indexOf(cellIndex) !== -1; });
    if (!ship) return { result: 'miss', ship: null };
    ship.hits += 1;
    if (ship.hits >= ship.size) {
      ship.sunk = true;
      return { result: 'sunk', ship: ship };
    }
    return { result: 'hit', ship: ship };
  }

  function allShipsSunk(ships) {
    return ships.every(function (s) { return s.sunk; });
  }

  function coordLabel(cellIndex) {
    var row = String.fromCharCode(65 + Math.floor(cellIndex / BOARD_SIZE));
    var col = (cellIndex % BOARD_SIZE) + 1;
    return row + col;
  }

  /* ---------- Export for Node self-check (ignored in browser) ---------- */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      BOARD_SIZE: BOARD_SIZE,
      TOTAL_CELLS: TOTAL_CELLS,
      FLEET: FLEET,
      createFleet: createFleet,
      registerShot: registerShot,
      allShipsSunk: allShipsSunk,
      coordLabel: coordLabel
    };
    return; // stop here when running under Node — no DOM below
  }

  /* ---------- Browser UI ---------- */

  var state = {
    playerFleet: null,
    enemyFleet: null,
    playerShots: null,   // Set of enemy cells already fired at
    enemyShots: null,    // Set of player cells AI already fired at
    turn: 'player',
    over: false
  };

  var enemyBoardEl = document.getElementById('enemy-board');
  var playerBoardEl = document.getElementById('player-board');
  var statusEl = document.getElementById('status-message');
  var logEl = document.getElementById('battle-log');
  var playerFleetListEl = document.getElementById('player-fleet-status');
  var enemyFleetListEl = document.getElementById('enemy-fleet-status');
  var bannerEl = document.getElementById('game-over-banner');
  var bannerTextEl = document.getElementById('game-over-text');

  function buildBoard(container, isEnemy) {
    container.innerHTML = '';
    container.classList.add('grid');
    if (isEnemy) container.classList.add('enemy-board');

    var corner = document.createElement('div');
    corner.className = 'label';
    container.appendChild(corner);
    for (var c = 1; c <= BOARD_SIZE; c++) {
      var colLabel = document.createElement('div');
      colLabel.className = 'label';
      colLabel.textContent = c;
      container.appendChild(colLabel);
    }
    for (var r = 0; r < BOARD_SIZE; r++) {
      var rowLabel = document.createElement('div');
      rowLabel.className = 'label';
      rowLabel.textContent = String.fromCharCode(65 + r);
      container.appendChild(rowLabel);
      for (var col = 0; col < BOARD_SIZE; col++) {
        (function (idx) {
          var cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'cell';
          cell.dataset.index = idx;
          cell.setAttribute('aria-label', 'Fire at ' + coordLabel(idx));
          if (isEnemy) {
            cell.addEventListener('click', function () { playerFire(idx); });
          } else {
            cell.disabled = true; // player board is display-only
          }
          container.appendChild(cell);
        })(r * BOARD_SIZE + col);
      }
    }
  }

  function cellAt(container, idx) {
    return container.querySelector('button.cell[data-index="' + idx + '"]');
  }

  function renderFleetStatus(listEl, ships, revealNames) {
    listEl.innerHTML = '';
    ships.forEach(function (ship) {
      var li = document.createElement('li');
      li.textContent = ship.name + ' (' + ship.size + ')';
      if (ship.sunk) {
        li.classList.add('sunk');
        li.textContent += ' — Sunk';
      }
      listEl.appendChild(li);
    });
  }

  function log(message) {
    var p = document.createElement('p');
    p.textContent = message;
    logEl.prepend(p);
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function newGame() {
    state.playerFleet = createFleet();
    state.enemyFleet = createFleet();
    state.playerShots = new Set();
    state.enemyShots = new Set();
    state.turn = 'player';
    state.over = false;

    buildBoard(playerBoardEl, false);
    buildBoard(enemyBoardEl, true);

    // Show player's own ships on their board
    state.playerFleet.forEach(function (ship) {
      ship.cells.forEach(function (idx) {
        cellAt(playerBoardEl, idx).classList.add('ship');
      });
    });

    renderFleetStatus(playerFleetListEl, state.playerFleet);
    renderFleetStatus(enemyFleetListEl, state.enemyFleet);
    logEl.innerHTML = '';
    bannerEl.hidden = true;
    setStatus('Your turn — click a square on the enemy waters to fire!');
    log('New battle started. Both fleets are in position.');
  }

  function playerFire(idx) {
    if (state.over || state.turn !== 'player') return;
    if (state.playerShots.has(idx)) return;
    state.playerShots.add(idx);

    var outcome = registerShot(state.enemyFleet, idx);
    var cell = cellAt(enemyBoardEl, idx);
    cell.disabled = true;

    if (outcome.result === 'miss') {
      cell.classList.add('miss');
      cell.setAttribute('aria-label', coordLabel(idx) + ' — miss');
      log('You fired at ' + coordLabel(idx) + ' — miss.');
    } else {
      cell.classList.add(outcome.result === 'sunk' ? 'sunk' : 'hit');
      cell.setAttribute('aria-label', coordLabel(idx) + ' — ' + outcome.result);
      if (outcome.result === 'sunk') {
        log('You fired at ' + coordLabel(idx) + ' — HIT! You sank the enemy ' + outcome.ship.name + '!');
        renderFleetStatus(enemyFleetListEl, state.enemyFleet);
      } else {
        log('You fired at ' + coordLabel(idx) + ' — HIT!');
      }
    }

    if (allShipsSunk(state.enemyFleet)) {
      endGame(true);
      return;
    }

    state.turn = 'enemy';
    enemyBoardEl.classList.add('locked');
    setStatus('Enemy is taking aim…');
    setTimeout(enemyFire, 900);
  }

  function enemyFire() {
    if (state.over) return;

    // AI picks a random cell it has not fired at yet (Math.random).
    var remaining = [];
    for (var i = 0; i < TOTAL_CELLS; i++) {
      if (!state.enemyShots.has(i)) remaining.push(i);
    }
    var idx = remaining[randomInt(remaining.length)];
    state.enemyShots.add(idx);

    var outcome = registerShot(state.playerFleet, idx);
    var cell = cellAt(playerBoardEl, idx);

    if (outcome.result === 'miss') {
      cell.classList.add('miss');
      cell.setAttribute('aria-label', coordLabel(idx) + ' — enemy missed here');
      log('Enemy fired at ' + coordLabel(idx) + ' — miss.');
    } else {
      cell.classList.add(outcome.result === 'sunk' ? 'sunk' : 'hit');
      cell.setAttribute('aria-label', coordLabel(idx) + ' — your ship was hit here');
      if (outcome.result === 'sunk') {
        log('Enemy fired at ' + coordLabel(idx) + ' — your ' + outcome.ship.name + ' was sunk!');
        renderFleetStatus(playerFleetListEl, state.playerFleet);
      } else {
        log('Enemy fired at ' + coordLabel(idx) + ' — your ship was hit!');
      }
    }

    if (allShipsSunk(state.playerFleet)) {
      endGame(false);
      return;
    }

    state.turn = 'player';
    enemyBoardEl.classList.remove('locked');
    setStatus('Your turn — fire at the enemy waters!');
  }

  function endGame(playerWon) {
    state.over = true;
    enemyBoardEl.classList.add('locked');
    bannerEl.hidden = false;
    bannerEl.classList.add(playerWon ? 'win' : 'lose');
    bannerTextEl.textContent = playerWon
      ? 'Victory! You sank the entire enemy fleet. 🎉'
      : 'Defeat. The enemy sank your whole fleet. Try again!';
    setStatus(playerWon ? 'You win!' : 'You lose.');
    log(playerWon ? 'Battle over — victory!' : 'Battle over — defeat.');
  }

  document.getElementById('new-game-btn').addEventListener('click', newGame);
  newGame();
})();
