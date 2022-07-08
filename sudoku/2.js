'use strict';

/*
Basic data structures:

celldata / cdata:
    digit: null,
    candidates: [],
    // cell data should known row & col of itself
    xx: i,
    yy: j,
    box_idx,
*/

/*
 * Grid is the whole 9x9 sudoku area. It contains 9x9=81 cells.
 * Every cell, which we use cdata (cell data) to represent, contains
 * information of a cell, such as digit and position.
 * xx ~ [0, 8], xx + 1 = row;
 * yy ~ [0, 8], yy + 1 = col;
 */
class Grid {
  cells = Array(9 * 9);
  b_rowcol_swapped = false;

  constructor() {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = {
        xx: Math.floor(i / 9),
        yy: i % 9,
        digit: null,
        candidates: [],
      };
    }

    for (let box_idx = 0; box_idx < Grid.BOX.length; box_idx++) {
      Grid.BOX[box_idx].forEach((i) => {
        this.cells[i].box_idx = box_idx;
      });
    }
  }

  cells_of_row(i) {
    return this.cells.filter((grid) => grid.xx == i)
  }

  cells_of_col(i) {
    return this.cells.filter((grid) => grid.yy == i)
  }

  cells_of_box(i) {
    return Grid.BOX[i].map((idx) => this.cells[idx]);
  }

  cell(xx, yy) {
    return this.cells[xx * 9 + yy];
  }

  all_rows() {
    var all = [];
    for (let i = 0; i < 9; i++)
      all.push(this.cells_of_row(i));
    return all;
  }

  all_boxes() {
    var all = [];
    for (let i = 0; i < 9; i++)
      all.push(this.cells_of_box(i));
    return all;
  }

  _swap_row_col() {
    for (const cdata of this.cells) {
      const tmp = cdata.xx; cdata.xx = cdata.yy; cdata.yy = tmp;
    }
    this.b_rowcol_swapped = !this.b_rowcol_swapped;
  }

  _swap_back() {
    if (this.b_rowcol_swapped)
      this._swap_row_col();
  }

  process_with_swapped_rowcol(callback) {
    if (!this.b_rowcol_swapped)
      this._swap_row_col();

    const ret = callback();

    this._swap_back();
    return ret;
  }

  /////

  for_each_cell(callback) {
    this.cells.forEach((cell) => {
      callback(cell.xx + 1, cell.yy + 1, cell);
    });
  }

  // load something like this:
  // '6.....253..31.......7.5...9..2..4.1.1.......6.9.7..3..9...8.5.......59..351.....4',
  load_puzzle(puzzle_desc) {
    if (puzzle_desc.length < 81) {
      alert('Cannot load puzzle: ' + puzzle_desc);
      return;
    }

    this.cells.forEach((cdata, i) => {
      var digit = puzzle_desc[i];
      digit = (digit == '.')? null : Number(digit);
      cdata.digit = digit;
      cdata.alterable = digit? false : true;
    });
  }

  // check if the sudoku puzzle has been finished
  finished() {
    if (this.cells.filter(cdata => !!cdata.digit).length != 81)
      return false;

    // all cells have been filled, check if row/col/box has duplicate digits

    function house_has_duplicate(house_list) {
      const bad_rows = house_list.some((cells, i) => {
        const s = new Set(cells.map(cdata => cdata.digit));
        if (s.size < 9) {
          console.log('row ' + i + ': duplicate digits found');
          return true;
        }
      });
      return bad_rows.length > 0;
    }

    if (house_has_duplicate(this.all_rows()))
      return false;

    const hasdup = this.process_with_swapped_rowcol(() =>
      house_has_duplicate(this.all_rows()));
    if (hasdup)
      return false;

    if (house_has_duplicate(this.all_boxes()))
      return false;

    return true;
  }
}

// set the index of every cell in every box
/*
  0  1  2    3  4  5    6  7  8
  9 10 11   12 13 14   15 16 17
 18 19 20   21 22 23   24 25 26

 27 28 29   30 31 32   33 34 35
 36 37 38   39 40 41   42 43 44
 45 46 47   48 49 50   51 52 53

 54 55 56   57 58 59   60 61 62
 63 64 65   66 67 68   69 70 71
 72 73 74   75 76 77   78 79 80
*/
Grid.BOX = [
  // 0, 1, 2
  [ 0, 1, 2, 9, 10, 11, 18, 19, 20 ],
  [ 3, 4, 5, 12, 13, 14, 21, 22, 23 ],
  [ 6, 7, 8, 15, 16, 17, 24, 25, 26 ],

  // 3, 4, 5
  [ 27, 28, 29, 36, 37, 38, 45, 46, 47 ],
  [ 30, 31, 32, 39, 40, 41, 48, 49, 50 ],
  [ 33, 34, 35, 42, 43, 44, 51, 52, 53 ],

  // 6, 7, 8
  [ 54, 55, 56, 63, 64, 65, 72, 73, 74 ],
  [ 57, 58, 59, 66, 67, 68, 75, 76, 77 ],
  [ 60, 61, 62, 69, 70, 71, 78, 79, 80 ],
];

Grid.in_same_row = function(arg) {
  if (arg instanceof Array)
    return Grid.in_same_row(...arg);

  const idx = arguments[0].xx;
  for (const cdata of arguments) {
    if (cdata.xx != idx)
      return false;
  }
  return true;
}

Grid.in_same_col = function(arg) {
  if (arg instanceof Array)
    return Grid.in_same_col(...arg);

  const idx = arguments[0].yy;
  for (const cdata of arguments) {
    if (cdata.yy != idx)
      return false;
  }
  return true;
}

Grid.in_same_box = function(arg) {
  if (arg instanceof Array)
    return Grid.in_same_box(...arg);

  const idx = arguments[0].box_idx;
  for (const cdata of arguments) {
    if (cdata.box_idx != idx)
      return false;
  }
  return true;
}

/*
 * Only works for cdata object
 */
Array.prototype.with_candidates = function(candidates) {
  if (this.length == 0 || !this[0].candidates)
    return [];

  return this.filter((cdata) => {
    if (cdata.candidates.length == 0)
      return false;
    return intersect(cdata.candidates, candidates).length > 0;
  });
};

addEventListener('load', function(e) {
  //document.querySelector('#test').innerHTML = 'Hello, world!';

  // listen for switching between light/dark mode
  // code copied from hdj.me
  let media = window.matchMedia('(prefers-color-scheme: dark)');
  let callback = (e) => {
    switch_darkmode(e.matches);
  };
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', callback);
  }
  else if (typeof media.addListener === 'function') {
    media.addListener(callback);
  }

  window.APP = window.APP || {};

  APP.solvers = [
    solver_naked_single,
    solver_hidden_single,
    solver_locked_candidates_type_1,
    solver_locked_candidates_type_2,
    solver_locked_group,
    function(param) {
      if (param) return "Noop";
      return { digit: null, candidate_removals: [] };
    },
  ];

  // show new puzzle
  create_puzzle('h2');

  ///////////////////////
  //cell_mark_a(5, 5);
  //cell_mark_b(5, 6);
});

function $$(id) {
  if (window.debug)
    console.log(`looking for element: id=${id}`);
  return document.getElementById(id);
}

function $$$(class_name) {
  return document.getElementsByClassName(class_name);
}

// callback: function(element, zero-based-index, collection-itself)
function html_collection_for_each(collection, callback) {
  for (var i = 0; i < collection.length; i++) {
    callback(collection.item(i), i, collection);
  }
}

function create_puzzle(idx_or_name) {
  idx_or_name = idx_or_name || 0;

  // reset puzzle, also reset APP
  reset_puzzle();

  const stat = APP.stat;
  load_preset_puzzle(idx_or_name);
  stat.filled_initial_digits = true;

  // setup onclick listeners
  // if click a cell, then set its digit according to current selected digit
  html_collection_for_each($$$('cell'), function(elem, i) {
    elem.onclick = function() {
      console.log("clicked cell: " + elem.id);
      if (stat.highlighted_digit) {
        const row = elem.attributes['_row'].value;
        const col = elem.attributes['_col'].value;
        const digit = Number(stat.highlighted_digit);    // TODO every digit should be number instead of string
        if (stat.pencil_mode) {
          // pencil mode: set candidate
          cdata = cell_data(row, col);

          if (cdata.digit != null) {
            // the cell has digit, do nothing
            return;
          }

          if (cdata.candidates.length == 0) {
            cell_create_candidate_table(row, col);
          }

          console.log(cdata);
          if (cdata.candidates.includes(digit)) {
            cdata.candidates = cdata.candidates.filter(item => item != digit);
            cell_clear_candidate(row, col, digit);
            highlight_cell(row, col, false);
            // if no candidate exists, destroy candidates table
            if (cdata.candidates.length == 0) {
              cell_destroy_candidate_table(row, col);
            }
          }
          else {
            cdata.candidates.push(digit);
            cdata.candidates.sort();
            cell_set_candidate(row, col, digit);
            highlight_cell(row, col, true);
          }
        }
        else {
          // normal mode: clear candidates and set digit
          cell_set_digit(row, col, stat.highlighted_digit);
        }
      }
    };
  });

  // set darkmode on/off
  let media = window.matchMedia('(prefers-color-scheme: dark)');
  switch_darkmode(media.matches);

  setup_button_actions();
  setTimeout(fill_all_candidates, 300);
}

function reset_puzzle() {
  // recreate data structure
  APP.grid = new Grid();
  APP.stat = {
    filled_initial_digits: false,

    // pencil
    pencil_mode: false,

    // highlight
    highlighted_digit: null,
    xy_highlighted: false,
    button_with_highlighted_digit: null,
  };

  // reset UI
  seq_1_9.forEach(row =>
    seq_1_9.forEach(col => cell_reset(row, col)));
}

// id can be number (0, 1, 2, etc.) or string ('easy-1', 'hard-23', etc.)
function load_preset_puzzle(id) {
  const puzzle_desc = Number.isInteger(id)?
    window.preset_puzzles[id]
    :
    window.preset_puzzles.filter(x => x.includes('#' + id + '#'))[0];

  if (!puzzle_desc) {
    console.log('cannot load puzzle by "' + id + '"');
    return;
  }

  console.log('loading puzzle: "' + puzzle_desc + '"');
  APP.grid.load_puzzle(puzzle_desc);

  APP.grid.for_each_cell((row, col, cdata) => {
    if (cdata.digit)
      cell_set_digit(row, col, cdata.digit);
  });
}

function cell_data(row, col) {
  if (window.debug)
    console.log(`access cell data: (${row}, ${col})`);
  return APP.grid.cell(row - 1, col - 1);
}

function cell_set_digit(row, col, digit) {
  var cdata = cell_data(row, col);
  if (APP.stat.filled_initial_digits && !cdata.alterable) {
    console.log(`cell r${row}c${col} cannot be modified.`);
    return;
  }

  // cell data of itself
  cdata.digit = digit;
  cdata.candidates = [];

  // remove candidate of same houses, de-highlight them
  cells_of_same_house(row, col)
    .forEach(function(cell) {
      if (cell.cdata.candidates.includes(digit)) {
        array_delete_item_by_value(cell.cdata.candidates, digit);
        cell_clear_candidate(cell.row, cell.col, digit);
        highlight_cell(cell.row, cell.col, false);
      }
    });

  // update the UI of the cell
  cell_element_set_digit($$(cell_id(row, col)), digit);
  // highlight it anyway
  if (APP.stat.highlighted_digit == digit)
    highlight_cell(row, col, true);
}

function cell_element_set_digit(element, digit) {
  var html;
  if (APP.stat.in_darkmode)
    html = '<div class="has_color_scheme cell_digit darkmode">' + digit + '</div>';
  else
    html = '<div class="has_color_scheme cell_digit">' + digit + '</div>';
  element.innerHTML = html;
}

function cell_reset(row, col) {
  $$(cell_id(row, col)).innerHTML = '';
  $$(cell_id(row, col)).classList.remove('highlight');
}

function cell_id(row, col) {
  return "r" + row + "c" + col;
}

/*
 * index: [1, 81]
 * row: [1, 9]
 * col: [1, 9]
 */
function index_to_rowcol(index) {
  const row = Math.ceil(index / 9);
  const col = index % 9;
  if (col == 0)
    col = 9;
  //alert("row " + row + ", col " + col);
  return { row: row, col: col };
}

function switch_darkmode(enabled) {
  const elements = document.getElementsByClassName('has_color_scheme');
  for (var i = 0; i < elements.length; i++) {
    if (enabled)
      elements[i].classList.add("darkmode");
    else
      elements[i].classList.remove("darkmode");
  }

  APP.stat.in_darkmode = enabled;
}

function setup_button_actions() {
  const digit_button_elements = $$$('btn_digit');

  // onclick: switch on/off hightlight digits
  html_collection_for_each(digit_button_elements, function(btn) {
    btn.onclick = function() {
      click_digit_button(btn);
    };
  });

  // pencil button
  $$('btn_pencil').onclick = click_pencil_button;

  // XY button
  $$('btn_xy').onclick = click_xy_button;
  /*
  */
}

function click_digit_button(btn) {
  const stat = APP.stat;
  const digit_of_button = Number(btn.textContent);
  const oldval = stat.highlighted_digit;
  const oldbtn = stat.button_with_highlighted_digit;
  //console.log("click_digit_button: " + digit_of_button);

  if (oldval)
    highlight_digit(oldval, false);
  if (oldbtn)
    oldbtn.classList.remove('btn_highlighted');

  // turn off XY cell & button highlight
  if (stat.xy_highlighted)
    click_xy_button();

  if (digit_of_button == oldval) {
    // turn off highlight for the same digit
    highlight_digit(digit_of_button, false);
    btn.classList.remove('btn_highlighted');
    stat.highlighted_digit = null;
    stat.button_with_highlighted_digit = null;
  }
  else {
    highlight_digit(digit_of_button, true);
    btn.classList.add('btn_highlighted');
    stat.highlighted_digit = digit_of_button;
    stat.button_with_highlighted_digit = btn;
  }
}

function click_pencil_button() {
  const stat = APP.stat;

  if (stat.pencil_mode) {
    stat.pencil_mode = false;
    var fn = function (elem) { elem.classList.replace('btn_digit_small', 'btn_digit_normal'); }
    var buttons = $$$('btn_digit');
    for (var i = 0; i < buttons.length; i++) {
      var e = buttons[i];
      console.log(">>> " + e);
      fn(e);
    }
    $$('btn_pencil').classList.remove('pencil_mode');
  }
  else {
    stat.pencil_mode = true;
    var fn = function (elem) { elem.classList.replace('btn_digit_normal', 'btn_digit_small'); }
    var buttons = $$$('btn_digit');
    for (var i = 0; i < buttons.length; i++) {
      var e = buttons[i];
      console.log(">>> " + e);
      fn(e);
    }
    $$('btn_pencil').classList.add('pencil_mode');
  }
  console.log('click_pencil_button clicked');
}

function click_xy_button() {
  const stat = APP.stat;
  const b_highlight_xy = !stat.xy_highlighted;

  if (b_highlight_xy) {
    if (stat.highlighted_digit) {
      click_digit_button(stat.button_with_highlighted_digit);
    }
    $$('btn_xy').classList.add('btn_highlighted');
  }
  else {
    $$('btn_xy').classList.remove('btn_highlighted');
  }

  highlight_xy_cell(b_highlight_xy);
  stat.xy_highlighted = b_highlight_xy;
}

function highlight_cell(row, col, b_highlight) {
  var elem = $$(cell_id(row, col));
  var b_contains = elem.classList.contains('highlight');
  if (b_contains == b_highlight)
    return;
  if (b_highlight) {
    elem.classList.add('highlight');
  }
  else {
    elem.classList.remove('highlight');
  }
}

function highlight_digit(digit, b_highlight) {
  digit = Number(digit);
  APP.grid.for_each_cell((row, col, cdata) => {
      //console.log('>>>>> ' + cell_id(row_idx + 1, col_idx + 1));
      if (cdata.digit == digit || cdata.candidates.includes(digit)) {
        highlight_cell(row, col, b_highlight);
      }
  });
}

function highlight_xy_cell(b_highlight) {
  APP.grid.for_each_cell((row, col, cdata) => {
    if (cdata.candidates.length == 2) {
      console.log('found xy: row ' + row + ', col ' + col);
      console.log(cdata.candidates);
      highlight_cell(row, col, b_highlight);
    }
  });
}

function cell_create_candidate_table(row, col) {
  var cdata = cell_data(row, col);
  if (!cdata.alterable) {
    alert('The cell has digit ' + cdata.digit + ', cannot be set as candidate cell.');
    return;
  }

  // clone a small table for candidate
  var new_id = `r${row}c${col}_candidate`;
  create_element_from_templ('candidate_table_template', new_id, cell_id(row, col));
}

function cell_destroy_candidate_table(row, col) {
  var cdata = cell_data(row, col);
  // TODO check digit == null?
  if (!cdata.alterable) {
    alert('The cell has digit ' + cdata.digit + ', cannot be set as candidate cell.');
    return;
  }
  if (cdata.candidates.length > 0) {
    alert(`row ${row} col ${col}: there are candidates yet, you cannot call cell_destroy_candidate_table().`);
    return;
  }

  // TODO use removeChild()?
  $$(cell_id(row, col)).innerHTML = '';
}

function find_candidate_element(row, col, candidate_digit) {
  var selector = `#r${row}c${col}_candidate #candidate_${candidate_digit}`;
  var elem = document.querySelector(selector);
  if (!elem) {
    console.error('cannot found element, selector: ' + selector);
  }
  return elem;
}

function cell_set_candidate(row, col, digit) {
  var elem = find_candidate_element(row, col, digit);
  if (elem)
    elem.textContent = digit;
}

function cell_clear_candidate(row, col, digit) {
  const cdata = cell_data(row, col);
  cdata.candidates = cdata.candidates.filter(item => item != digit);
  var elem = find_candidate_element(row, col, digit);
  if (elem)
    elem.textContent = null;
}

// row, col, boxid: all are of range [1, 9].
function rowcol2boxid(row, col) {
  if (row <= 3) {
    if (col <= 3)
      return 1;
    if (col <= 6)
      return 2;
    return 3;
  }
  if (row <= 6) {
    if (col <= 3)
      return 4;
    if (col <= 6)
      return 5;
    return 6;
  }
  if (col <= 3)
    return 7;
  if (col <= 6)
    return 8;
  return 9;
}

/*
 * return list of { .row, .col, .cdata }.
 */
function cells_of_same_house(row, col) {
  var cell_idxpair_list = []; // cells within the same row, col and box
  var xx = row - 1;
  var yy = col - 1;
  var cells = [];

  // cells of same row
  seq_0_8.forEach(function(j) {
    if (j != yy) {
      cell_idxpair_list.push([xx, j]);
    }
  });

  // cells of same col
  seq_0_8.forEach(function(i) {
    if (i != xx) {
      cell_idxpair_list.push([i, yy]);
    }
  });

  // cells of same box
  var boxid = rowcol2boxid(row, col);
  // TODO window.boxes should be deleted!!!
  boxes[boxid - 1].forEach(function(x) {
    if (x[0] != xx || x[1] != yy) {
      cell_idxpair_list.push(x);
    }
  });

  cell_idxpair_list.forEach(function(idx_pair) {
    var xx = idx_pair[0];
    var yy = idx_pair[1];
    var row = xx + 1;
    var col = yy + 1;
    var cell = {
      row: row,
      col: col,
      cdata: cell_data(row, col),
    };
    cells.push(cell);
  });

  return cells;
}

function cell_fill_candidates(row, col) {
  var cells = cells_of_same_house(row, col);

  // check every cells and find missing digits (i.e., candidates)
  var known_digits = Array(10);
  known_digits.fill(0);
  cells.forEach(function(cell) {
    var digit = cell.cdata.digit;
    if (digit)
      known_digits[digit] = digit;
  });

  var candidates = [];
  known_digits.forEach(function(value, idx) {
    if (idx != 0 && !value) {
      //console.log("candidate: " + idx)
      candidates.push(idx);
    }
  });
  console.log(`(${row}, ${col}) candidates: ` + candidates);

  // update data
  cell_data(row, col).candidates = candidates;

  cell_create_candidate_table(row, col);
  candidates.forEach(candidate_digit =>
    cell_set_candidate(row, col, candidate_digit));
}

function fill_all_candidates() {
  seq_1_9.forEach(function(row) {
    seq_1_9.forEach(function(col) {
      if (!cell_data(row, col).digit) {
        cell_fill_candidates(row, col);
      }
    });
  });
}

function cell_mark_a(row, col) {
  // clone a small table for candidate
  var new_id = `r${row}c${col}_mark`;
  create_element_from_templ('mark_a_template', new_id, cell_id(row, col));
}

function cell_mark_b(row, col) {
  // clone a small table for candidate
  var new_id = `r${row}c${col}_mark`;
  create_element_from_templ('mark_b_template', new_id, cell_id(row, col));
}

function cell_append_element(cell_id, template_id, element_new_id) {
  create_element_from_templ(template_id, element_new_id, cell_id);
}

/*
 * clone a new element from template, and put it under somewhere,
 *   template-id,
 *   new-id,
 *   id-of-new-parent
 */
function create_element_from_templ(template_id, new_id, parent_id) {
  var templ = $$(template_id);
  var clone = templ.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('id', new_id);
  $$(parent_id).appendChild(clone);
}

/******************************************************************************/
/* utilities */
/******************************************************************************/

/*
 * delete an item from an array in place.
 */
function array_delete_item_by_value(arr, value) {
  const idx = arr.indexOf(value);
  if (idx != -1)
    arr.splice(idx, 1);
}

/*
 * https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
 */
function arrays_equal(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/*
 * https://stackoverflow.com/a/37041756
 */
function intersect(a, b) {
  var setB = new Set(b);
  //return [...new Set(a)].filter(x => setB.has(x));
  return a.filter(x => setB.has(x));
}

// return array of combinations
// e.g.,
//.  combinationer([1, 2, 3], 2) =>
//   [[1, 2], [1, 3], [2, 3]]
function combinationer(array, n) {
  // protect the code
  if (n > array.length || n < 1)
    return [];

  // special cases
  if (n == array.length)
    return [ array ];
  if (n == 1)
    return array.map(item => [ item ]);

  // a combination, is combinations of one item with combinations of rest-of-items
  var result = [];
  for (let i = 0; i < array.length - n + 1; i++) {
    const first = array.slice(i, i + 1);
    const rest = array.slice(i + 1);
    const combinations_of_rest = combinationer(rest, n - 1);
    const combinations = combinations_of_rest.map(c => first.concat(c));
    result = result.concat(combinations);
  }

  return result;
}

function find_first_cell_with(fn) {
  seq_0_8.some(function(xx) {
    return seq_0_8.some(function(yy) {
      return fn(xx, yy, cell_data(xx + 1, yy + 1));
    });
  });
}

// i: [0, 8]
// return all celldata in the box
function get_cells_of_box(i) {
  return APP.grid.cells_of_box(i);
}

function get_cells_of_row(xx) {
  return APP.grid.cells_of_row(xx);
}

function get_cells_of_col(yy) {
  return APP.grid.cells_of_col(yy);
}

// return list(set(cdata_list1) - set(cdata_list2))
// https://stackoverflow.com/questions/64027177/difference-upon-custom-attributes-between-two-arrays-having-partial-similar-ob
function exclude_cells(cdata_list1, cdata_list2) {
  const aa = cdata_list1, bb = cdata_list2;
  const diff = aa.filter(a => {
    return !bb.some(b => b == a);
  });
  return diff;
}

function check_cells_in_same_box(cdata_list) {
  var same = true;
  cdata_list.reduce((prev, current) => {
    if (prev.box_idx != current.box_idx)
      same = false;
    return current;
  });
  return same;
}

/******************************************************************************/
/* solvers */
/******************************************************************************/

// 寻找那些候选数格子里，只有一个候选数的。
// 本函数一次只找一个，并不试图找所有 naked single 格子。
function solver_naked_single(param) {
  // digit and candidate_removals cannot be both valid
  var answer = {
    technique: 'Naked Single',
    row: null,
    col: null,
    digit: null,
    candidate_removals: null,
    /*
    candidate_removals: [
      {
        row: ,
        col: ,
        candidates: [],
      },
      ...,
    ],
    */
  };

  if (param)
    return answer.technique;

  find_first_cell_with(function(xx, yy, cdata) {
    if (cdata.candidates.length == 1) {
      answer.row = xx + 1;
      answer.col = yy + 1;
      answer.digit = cdata.candidates[0];
      return true;
    }
    return false;
  });

  console.log(answer);
  return answer;
}

function solver_hidden_single(param) {
  var answer = {
    technique: 'Hidden Single',
  };
  var found = null;
  const stat = APP.stat;

  if (param)
    return answer.technique;

  var check_house = function (cells) {
    var slots = Array(9 + 1);
    ///////slots.fill(Array());     // do fill array like this !!!!!
    // slots.forEach(function (item, i) {  // and this !!!!!
    //   slots[i] = [];
    // });
    for (let i = 0; i < slots.length; i++) {
      slots[i] = [];
    }

    //console.log('checking row ' + xx);

    // TODO: consider digit & candidates...
    cells.forEach(function (cdata, yy) {
      cdata.candidates.forEach(digit => slots[digit].push(cdata));
    });

    return slots.some(function(slot, idx) {
      if (slot.length == 1) {
        const cdata = slot[0];
        found = {
          row: cdata.xx + 1,
          col: cdata.yy + 1,
          digit: idx,
          _candidates: cdata.candidates,
        };
        return true;
      }
    }); // end of slots.some()
  };

  do {
    // for every row, check if it has hidden single digit
    var result;
    result = seq_0_8.some(function (xx) {
      //console.log('checking row ' + xx);
      var row_cells = APP.grid.cells_of_row(xx);
      return check_house(row_cells);
    })
    if (result)
      break;

    // for every column
    result = seq_0_8.some(function (yy) {
      //console.log('checking col ' + yy);
      var col_cells = APP.grid.cells_of_col(yy);
      return check_house(col_cells);
    });
    if (result)
      break;

    // for every box
    seq_0_8.some(function (n) {
      //console.log('checking box ' + n);
      var box_cells = APP.grid.cells_of_box(n);
      return check_house(box_cells);
    });
  } while (0);

  if (found) {
    console.log(`found hidden single: r${found.row}c${found.col} = ${found.digit}`);
    console.log(found._candidates);
    Object.assign(answer, found);
  }
  return answer;
}

function find_candidate_removals(xx, yy, box_idx, cdata_excludes, candi) {
  const cells_of_same_house =
    xx != null? get_cells_of_row(xx) :
        yy != null? get_cells_of_col(yy) : get_cells_of_box(box_idx);

  const other_cells = exclude_cells(cells_of_same_house, cdata_excludes);
  const cells_with_candi = other_cells.filter(cdata =>
    cdata.candidates.includes(candi));

  if (cells_with_candi.length > 0) {
    //console.log('found candi ' + candi + ' !!!!!!!!!');
    var answer = {};
    answer.candidate_removals = cells_with_candi.map((cdata) => {
      return {
        row: cdata.xx + 1,
        col: cdata.yy + 1,
        candidates: [candi],
      };
    });
    return answer;
  }
  return null;
}

function find_cells_contains_candidates(cdata_list, candidates) {
  var result = [];
  for (const cdata of cdata_list) {
    if (cdata.candidates.length > 0) {
      for (const candi of candidates) {
        if (cdata.candidates.includes(candi))
          result.push(cdata);
      }
    }
  }
  return result;
}

function solver_locked_candidates_type_1(param) {
  var answer = { technique: 'Locked Candidates Type 1 (Pointing)' };
  if (param)
    return answer.technique;

  APP.grid.all_boxes().some((cells_of_box, i) => {
    const candi_map = collect_candidates_into_map(cells_of_box);

    // for every candidate, examine cells contain it
    for (const [candi, slots] of candi_map) {
      // if the slots has only one cdata, it should be nacked or hidden single
      if (slots.length < 2)
        continue;

      if (Grid.in_same_row(slots)) {
        const answer_ = find_candidate_removals(slots[0].xx, null, null, slots, candi);
        if (answer_) {
          Object.assign(answer, answer_);
          break; // if found any answer, return immediately
        }
      }

      if (Grid.in_same_col(slots)) {
        const answer_ = find_candidate_removals(null, slots[0].yy, null, slots, candi);
        if (answer_) {
          Object.assign(answer, answer_);
          break;
        }
      }
    }

    // if found any answer, return immediately
    return answer.candidate_removals != null;
  });

  return answer;
}

function collect_candidates_into_map(cdata_list) {
  // construct a mapping bwteen candidates and cells:
  //   candidate-1 => [cdata1, cdata2, ...]
  //   candidate-2 => [cdata2, cdata3, ...]
  //   ...
  const candi_map = new Map();
  cdata_list.forEach((cdata) => {
    cdata.candidates.forEach(candi => {
      const slots = candi_map.get(candi);
      if (!slots)
        candi_map.set(candi, Array());
      candi_map.get(candi).push(cdata);
    });
  });

  return candi_map;
}

function solver_locked_candidates_type_2(param) {
  var answer = {
    technique: 'Locked Candidates Type 2 (Claiming)'
  };

  if (param)
    return answer.technique;

  const function_list = [
    ...seq_0_8.map(i => function () { return get_cells_of_row(i); }),
    ...seq_0_8.map(i => function () { return get_cells_of_col(i); }),
  ];

  // for every row / col, find all candidates
  //    for every candidate, check if it in only one box
  //        if true, and if the box has the candidate in other rows / cols,
  //            remove them.
  function_list.some(fn => {
    const cells = fn();
    const candi_map = collect_candidates_into_map(cells);

    for (const [candi, slots] of candi_map) {
      // if the slots has only one cdata, it should be nacked or hidden single
      if (slots.length < 2)
        continue;

      if (check_cells_in_same_box(slots)) {
        const answer_ = find_candidate_removals(null, null, slots[0].box_idx, slots, candi);
        if (answer_) {
          Object.assign(answer, answer_);
          break; // if found any answer, return immediately
        }
      }
    }
  });

  return answer;
}

function __OLD_FUNCTION_RESERVED_solver_locked_pair(param) {
  var answer = {
    technique: 'Locked Pair'
  };

  if (param)
    return answer.technique;

  const function_list = [
    ...seq_0_8.map(i => function () { return get_cells_of_row(i); }),
    ...seq_0_8.map(i => function () { return get_cells_of_col(i); }),
    ...seq_0_8.map(i => function () { return get_cells_of_box(i); }),
  ];
  /*
  const function_list = [
    function() { return get_cells_of_row(7); }
  ];
  */

  function_list.some(fn_get_cells_of_one_house => {
    var cells_with_candis = [];
    const cells = fn_get_cells_of_one_house();

    // cells with two candidates
    const xy_cells = cells.filter((cdata) => cdata.candidates.length == 2);

    const combinations = combinationer(xy_cells, 2);
    for (const combin of combinations) {
      const a = combin[0];
      const b = combin[1];
      if (arrays_equal(a.candidates, b.candidates)) {
        //console.log(combin[0].candidates);
        //console.log(combin[1].candidates);
        console.log(`found locked pair: (${a.xx}, ${a.yy}) && (${b.xx}, ${b.yy})`, a.candidates);
        if (a.xx == b.xx) { // same row
          const tmp = find_cells_contains_candidates(get_cells_of_row(a.xx), a.candidates);
          cells_with_candis.push(...tmp);
        }
        else if (a.yy == b.yy) { // same column
          const tmp = find_cells_contains_candidates(get_cells_of_col(a.yy), a.candidates);
          cells_with_candis.push(...tmp);
        }
        if (a.box_idx == b.box_idx) { // same box
          const tmp = find_cells_contains_candidates(get_cells_of_box(a.box_idx), a.candidates);
          cells_with_candis.push(...tmp);
        }

        cells_with_candis = exclude_cells(cells_with_candis, combin);

        if (cells_with_candis.length > 0) {
          // got answer
          console.log("got answer: ", cells_with_candis);
          answer.candidate_removals = cells_with_candis.map((cdata) => {
            return {
              row: cdata.xx + 1,
              col: cdata.yy + 1,
              candidates: intersect(cdata.candidates, a.candidates),
            };
          });
          break;
        }
      } // end of if (...)
    } // end of for..of

    if (cells_with_candis.length > 0)
      return true;
  }); // end of list.some(...)

  return answer;
}

function find_locked_group(cdata_list, group_size) {
  var cells_for_removing = [];
  var candidate_group = [];

  const candidate_cells = cdata_list.filter(cdata => cdata.candidates.length > 0);

  const cells = candidate_cells.filter(cdata =>
    cdata.candidates.length > 1 && cdata.candidates.length < group_size + 1);
  if (cells.length < group_size)
    return null;

  // now cells may be the naked/locked group

  const combinations = combinationer(cells, group_size);
  for (const combin of combinations) {
    // collect all candidates in the group
    const candi_set = new Set();
    combin.forEach((cdata) =>
      cdata.candidates.forEach((candi) =>
        candi_set.add(candi)));

    if (candi_set.size != combin.length)
      continue;

    // the candidates occupy exactly the cells
    console.log('found locked group: ', combin);

    candidate_group = [...candi_set];
    candidate_group.sort();

    if (Grid.in_same_row(combin)) {
      cells_for_removing.push(
        ...get_cells_of_row(combin[0].xx).with_candidates(candidate_group)
      );
    }

    // same column? TODO

    if (Grid.in_same_box(combin)) {
      cells_for_removing.push(
        ...get_cells_of_box(combin[0].box_idx).with_candidates(candidate_group)
      );
    }

    cells_for_removing = exclude_cells(cells_for_removing, combin);
    //console.log('cells_for_removing.length = ', cells_for_removing.length);

    // found some cells which should not contain the candidates
    // in the locked group
    if (cells_for_removing.length > 0) {
      console.log("got answer: ", cells_for_removing);
      break; // since found answer, don't check other houses any more
    }
  } // end of for..of

  if (cells_for_removing.length > 0) {
    return {
      cells_for_removing: cells_for_removing,
      candidates: candidate_group,
    };
  }

  return null;
}

function build_removals(cells_for_removing, candidate_group) {
  const removals = cells_for_removing.map((cdata) => {
    return {
      row: cdata.xx + 1,
      col: cdata.yy + 1,
      candidates: intersect(cdata.candidates, candidate_group),
    };
  });
  return removals;
}

function solver_locked_group(param) {
  const technique = 'Locked Group (2/3/4/5)';
  if (param)
    return technique;

  const locked_group_config = [
    { technique: 'Locked Pair', group_size: 2 },
    { technique: 'Locked Triple', group_size: 3 },
    { technique: 'Naked Quadruple', group_size: 4 },
    { technique: 'Naked Quintuple (5 digits)', group_size: 5 }, // !!!
  ];

  function process_rows(answer, locked_group_size) {
    APP.grid.all_rows().some(cells_of_row => {
      const ret = find_locked_group(cells_of_row, locked_group_size);
      if (ret) {
        answer._removal = ret;
        return true;
      }
    });
  }

  for (const config of locked_group_config) {
    var answer = { technique: config.technique };
    console.log('locked group: group_size ' + config.group_size);

    // process rows
    process_rows(answer, config.group_size);
    if (answer._removal)
      return answer;

    // process columns
    APP.grid.process_with_swapped_rowcol(() =>
      process_rows(answer, config.group_size));
    if (answer._removal)
      return answer;

    // process box
    APP.grid.all_boxes().some(cells_of_box => {
      const ret = find_locked_group(cells_of_box, config.group_size);
      if (ret) {
        answer._removal = ret;
        return true;
      }
    });
    if (answer._removal)
      return answer;
  }

  // found nothing, return empty answer
  return { technique: technique };
}

function solve_puzzle(interval_ms) {
  interval_ms = interval_ms || 100;
  var step = 1;

  // return:
  //   true - got answer and applied
  //   false - don't know how to solve it, give up
  var solve = function() {
    for (const solver_fn of APP.solvers) {
      console.log('trying ' + solver_fn('query solver name') + '...');
      var answer = solver_fn();

      if (answer._removal) {
        answer.candidate_removals = build_removals(
          answer._removal.cells_for_removing, answer._removal.candidates)
      }

      if (answer.digit) {
        const message = `${step}. [${answer.technique}] r${answer.row}c${answer.col}: digit=${answer.digit}\n`;
        step += 1;
        $$('solving_progress_text').value += message;
        cell_set_digit(answer.row, answer.col, answer.digit);
        return true; // break loop and return on success
      }
      else if (answer.candidate_removals && answer.candidate_removals.length > 0) {
        const text1 = answer.candidate_removals.map(removal =>
          `r${removal.row}c${removal.col} <> ${removal.candidates}`)
          .join(', ');
        const message = `${step}. [${answer.technique}] ${text1}\n`;
        step += 1;
        $$('solving_progress_text').value += message;

        answer.candidate_removals.forEach(removal => {
          removal.candidates.forEach(candi => {
            cell_clear_candidate(removal.row, removal.col, candi);
          });
        });

        return true;
      }
      console.log('not found answer.');
    }

    return false;
  }

  var call_solve = function () {
    if (!APP.grid.finished()) {
      const answer_applied = solve();
      if (answer_applied) {
        if (APP.grid.finished())
          $$('solving_progress_text').value += "Finished.\n";
        else
          setTimeout(call_solve, interval_ms);
      }
      else {
        $$('solving_progress_text').value += "Not finished yet.\n";
      }
    }
  };

  setTimeout(call_solve, interval_ms);
}

/*
 * vim:ts=2:sw=2:ai:et
 */
