/* jshint browser: true */
/**
 * GameGrid.js
 * v0.0.1
 *
 * Custom grid layout tool. Roughly similar to Desandro's Masonry, 
 * but built with an alternate purpose in mind and a desire to customize the feature-set on a per-project basis
 *
 * Example:
 *
 * var grid = new GameGrid();
 *
 * - or -
 *
 * var grid = new GameGrid({
 *   rootEl: document.querySelector('#your_grid_name'),
 *   cardSelector: '.your_item_classname_or_id'
 * });
 *
 *
 * TODO: Add custom per-tile behaviors
 * TODO: Integrate with ViewportStateManager
 * TODO: Make animation delays dynamice
 * TODO: Expose callbacks/triggers or inclue app-level event hooks
 */
(function (w) {

  'use strict';
  
  // Module wrapper
  var GameGrid = function () {

    /**
     * Set defaults which can be overridden on instantiation
     * @type {Object}
     */
    var defaults = {
      rootEl: document.querySelector('#game_grid'),
      cardSelector: '.game_card',
      columns: 4
    };

    var Grid = function (opts) {
      
      var rootEl = opts.rootEl || defaults.rootEl, // base <el>
          
          // Individual `cards`
          cardSelector = opts.cardSelector || defaults.cardSelector,
          
          // Number of columns
          columns = opts.columns || defaults.columns,
          
          // Hold running tally of column heights
          colHeights = [],

          // Vendor prefix transform method
          trans = Modernizr.prefixed('transform'),

          // Reference to nodelist of all `cards`
          cards,

          // Methods
          _getCards,
          _resetColumnHeights,
          _moveElement,
          _layout,
          _init;

      /**
       * Fetch node list of `block` items
       * @return {NodeList} DOM elements matching cardSelector
       */
      _getCards = function () {
        cards = rootEl.querySelectorAll(cardSelector);
      };

      /**
       * Set each column starting height to 0.
       * 
       */
      _resetColumnHeights = function () {
        var i = 0,
            len = columns;
        for (i; i < len; i++) { colHeights.push(0); }
      };

      /**
       * Move individual element into place
       * @param  {Object} opts - 
       *         top : <Number> : top in 'px',
       *         left: <Number> : left in '%',
       *         index: <Number> : element's index
       *         delay: <Boolean> : Do or don't delay
       */
      _moveElement = function (opts) {
        // Cache a reference to theel to run operations on
        var _e = opts.el;

        function run() {
          _e.style.top = opts.top + 'px';
          _e.style.left = opts.left + '%';
          _e.style[trans] = 'rotate(0deg)';
        }

        if (opts.delay) {
          setTimeout(run, (70 * opts.index));
        } else {
          run();
        }
      };


      /**
       * Run layout operations
       */
      _layout = function () {

        // Vars
        var i = 0,
            ww = document.documentElement.clientWidth,
            row = -1,
            len = cards.length;

        // Iterate over each `item`
        for (i; i < len; i++) {
          var el = cards[i], // Current item in this iteration
              currentColumn = (i % columns), // Current column
              top, left;
          
          // Reset column eavery nth iteration
          if (currentColumn === 0) row++;

          // The `top` value is just a running total
          top = (row > 0) ? colHeights[currentColumn] : 0;

          // The `left` value is a %
          left = ((100 / columns) * currentColumn);

          // Add this current items' height to this columns' total
          colHeights[currentColumn] += el.offsetHeight;

          // Invoke the move element method
          _moveElement({
            el: el,
            top: top,
            left: left,
            index: i,
            delay: el.getAttribute('data-delay')
          });
        }
      };

      
      /**
       * Kick things off here!
       */
      _init = function () {
        // Populate columnHeights arrays with 0s
        _resetColumnHeights();

        // Set our `instance-wide` items value
        _getCards();

        // Make this happen!
        _layout();
      };


      /**
       * Expose API
       */
      return {
        initialize: _init
      };

    };
    
    return Grid;
  };

  /**
   * Transport
   */
  if (typeof define === 'function' && define.amd) {
    define(GameGrid);
  } else {
    w.GameGrid = GameGrid;
  }

})(window);