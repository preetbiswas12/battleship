/* Self-check for the Battleships core logic. Run: node tests/test.js */
'use strict';

var assert = require('assert');
var game = require('../js/game.js');

// 1. Fleet shape matches the standard fleet
var fleet = game.createFleet();
assert.strictEqual(fleet.length, game.FLEET.length, 'fleet has 5 ships');
game.FLEET.forEach(function (spec) {
  var ship = fleet.find(function (s) { return s.name === spec.name; });
  assert.ok(ship, spec.name + ' exists');
  assert.strictEqual(ship.cells.length, spec.size, spec.name + ' has correct size');
});

// 2. No overlapping or out-of-bounds cells across the whole fleet
var seen = {};
fleet.forEach(function (ship) {
  ship.cells.forEach(function (idx) {
    assert.ok(idx >= 0 && idx < game.TOTAL_CELLS, 'cell in bounds: ' + idx);
    assert.ok(!seen[idx], 'no overlap at cell ' + idx);
    seen[idx] = true;
  });
});

// 3. Ships are contiguous lines (each next cell is +1 col on same row, or next row)
fleet.forEach(function (ship) {
  var sorted = ship.cells.slice().sort(function (a, b) { return a - b; });
  var sameRow = sorted.every(function (idx) {
    return Math.floor(idx / game.BOARD_SIZE) === Math.floor(sorted[0] / game.BOARD_SIZE);
  });
  if (sameRow) {
    sorted.forEach(function (idx, i) { assert.strictEqual(idx, sorted[0] + i); });
  } else {
    sorted.forEach(function (idx, i) { assert.strictEqual(idx, sorted[0] + i * game.BOARD_SIZE); });
  }
});

// 4. Random placement actually varies between games
var firstCells = fleet.map(function (s) { return s.cells.join(','); }).join('|');
var differs = false;
for (var run = 0; run < 20 && !differs; run++) {
  var other = game.createFleet();
  if (other.map(function (s) { return s.cells.join(','); }).join('|') !== firstCells) differs = true;
}
assert.ok(differs, 'placement is randomised');

// 5. Shot registration: miss / hit / sunk sequence
var f2 = [{ name: 'Destroyer', size: 2, cells: [0, 1], hits: 0, sunk: false }];
assert.strictEqual(game.registerShot(f2, 50).result, 'miss');
assert.strictEqual(game.registerShot(f2, 0).result, 'hit');
assert.strictEqual(game.registerShot(f2, 1).result, 'sunk');
assert.ok(game.allShipsSunk(f2));
assert.strictEqual(f2[0].hits, 2, 'extra shots not double-counted via sunk path');

// 6. Win detection needs the whole fleet down
var f3 = [
  { name: 'A', size: 1, cells: [0], hits: 1, sunk: true },
  { name: 'B', size: 1, cells: [99], hits: 0, sunk: false }
];
assert.ok(!game.allShipsSunk(f3));
f3[1].sunk = true;
assert.ok(game.allShipsSunk(f3));

// 7. Coordinate labels
assert.strictEqual(game.coordLabel(0), 'A1');
assert.strictEqual(game.coordLabel(9), 'A10');
assert.strictEqual(game.coordLabel(10), 'B1');
assert.strictEqual(game.coordLabel(99), 'J10');

// 8. Stress: 2000 random fleets always valid
for (var i = 0; i < 2000; i++) {
  var stress = game.createFleet();
  var occupied = {};
  stress.forEach(function (ship) {
    assert.strictEqual(ship.cells.length, ship.size);
    ship.cells.forEach(function (idx) {
      assert.ok(!occupied[idx]);
      occupied[idx] = true;
    });
  });
}

console.log('All ' + 8 + ' self-checks passed ✔');
