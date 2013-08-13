/* jshint browser: true */
/**
 * GameGrid.js
 * v0.2.1
 *
 * Custom grid layout tool. Roughly similar to Desandro's Masonry, 
 * but built with an alternate purpose in mind and a desire
 * to customize the feature-set on a per-project basis.
 *
 * =========================================================
 * DEPENDENCIES:
 *
 *  1. Modernizr.js - specifically Modernizr.prefixed() 
 *    * http://modernizr.com/docs/#prefixed
 *    * See README for more
 *  
 *  2. End Pool - https://github.com/wcst/end-pool
 *     * Needed to listen to multiple transitionEnd events
 * =========================================================
 *
 * ---
 * 
 * =========================================================
 * EXAMPLE USE:
 *
 * var grid = new GameGrid();
 *
 * - or -
 *
 * var grid = new GameGrid({
 *   rootEl: document.querySelector('#your_grid_name'),
 *   cardSelector: '.your_item_classname_or_id'
 * });
 * =========================================================
 *
 *
 *  ---
 * =========================================================
 * TODOS:
 * 
 * TODO: Add custom per-tile behaviors
 * TODO: Integrate with ViewportStateManager
 * TODO: Make animation delays dynamic
 * TODO: Expose callbacks/triggers or inclue app-level event hooks
 * =========================================================
 * 
 */
(function (w) {

  'use strict';
  
  // Module wrapper
  var GameGrid = function (EndPool) {
    
    /**
     * Set defaults which can be overridden on instantiation
     * @type {Object}
     */
    var defaults = {
      rootEl: document.querySelector('#game_grid'),
      cardSelector: '.game_card',
      columns: 4,
      offsetTop: 0
    };

    var Grid = function (opts) {
      
      var rootEl = opts.rootEl || defaults.rootEl, // base <el>
          
          // Individual `cards`
          cardSelector = opts.cardSelector || defaults.cardSelector,
          
          // Number of columns
          columns = opts.columns || defaults.columns,
          
          // Hold running tally of column heights
          colHeights = [],

          // Allow for custom left/right offsets
          offsetTop = opts.offsetTop || defaults.offsetTop,

          // Vendor prefix transform method
          trans = Modernizr.prefixed('transform'),

          // Reference to nodelist of all `cards`
          cards,

          // Create an instance of `EndPool`
          endPool = new EndPool(),

          // Methods
          _getCards,
          _resetColumnHeights,
          _moveElement,
          _layout,
          _refresh,
          _append,
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
        colHeights = [];
        for (i; i < len; i++) { colHeights.push(0); }
      };

      /**
       * Move individual element into place
       * @param  {Object} opts - 
       *         top : <Number> : top in 'px',
       *         left: <Number> : left in 'px' || '%',
       *         index: <Number> : element's index
       *         delay: <Boolean> : Do or don't delay
       */
      _moveElement = function (opts) {
        // Cache a reference to theel to run operations on
        var _e = opts.el,
            x = opts.left + 'px',
            y = opts.top + 'px',
            rot,
            transitionString;

        function run() {
          if (!Modernizr.csstransforms) {
            _e.style.left = x;
            _e.style.top = y;
          } else {
            rot = opts.straighten ? 0 : _e.getAttribute('data-rotate');

            transitionString = [
              'translate3d(',
              x, ', ', y, ', 0) ',
              'rotate(',
              rot,
              'deg)'
            ].join('');

            _e.style[trans] = transitionString;
            
            //
            // TODO: This should only be optional
            // 
            _e.style.opacity = 1;
          }
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
      _layout = function (opts) {
        // Vars
        var i = 0,
            ww = document.documentElement.clientWidth,
            row = -1,
            len = cards.length,
            straighten = (opts && typeof opts.straighten !== 'undefined') ? opts.straighten : true,
            maxHeight;

        // Listen for end events
        if (opts && typeof opts.listen === 'function') {
          //
          // TODO: The # of transition ends to listen for needs
          //       to be dynamic!
          //       
          endPool.listenForEndOfAll(cards, 2, opts.listen);
        }

        // Iterate over each `item`
        for (i; i < len; i++) {
          var el = cards[i], // Current item in this iteration
              currentColumn = (i % columns), // Current column
              top, left;
          
          // Reset column eavery nth iteration
          if (currentColumn === 0) row++;

          // The `top` value is just a running total
          if (offsetTop > 0) {
            top = (colHeights[currentColumn] + offsetTop);   
          } else {
            top = (row > 0) ? colHeights[currentColumn] : 0;
          }

          // If the 'left value is px', use:
          left = ((ww / columns) * currentColumn);

          // Add this current items' height to this columns' total
          colHeights[currentColumn] += el.offsetHeight;

          // Invoke the move element method
          _moveElement({
            el: el,
            top: top,
            left: left,
            index: i,
            straighten: straighten,
            delay: el.getAttribute('data-delay')
          });
        }

        //
        // Expand our container div to accomodate our new height
        // 
        // NOTE: +20 for `rsg` use-case to accomodate sticky footer
        // 
        maxHeight = Math.max.apply(Math, colHeights);
        rootEl.style.height = (maxHeight + 20) + 'px';
      };


      /**
       * Refresh the grid
       * 
       * @param  {Object} opts 
       *          - straighten: whether or not to reset rotate
       *          - listen: determine if a callback is needed
       *          - columns: number of columns to use for layout
       *          - offsetTop: if a desired offset is needed
       *          
       * @return {null}      null
       */
      _refresh = function (opts) {
        
        if (typeof opts !== 'undefined') {
          // Determine if new column structure is being requested
          if (typeof opts.columns !== 'undefined') {
            if (opts.columns !== columns)
              columns = opts.columns;
          }
          // Determine if an offset top is being added/changed
          if (typeof opts.offsetTop !== 'undefined') {
            offsetTop = opts.offsetTop;
          }          
        }

        // Reset the height of each columns
        _resetColumnHeights();

        // Re-run layout method and pass along the options
        _layout(opts);
      };


      /**
       * Append an item or set of items to the grid
       * 
       * NOTE: (as a document fragment)
       * 
       * @param  {Object} opts 
       *          - fragment: document Fragment (new items)
       *          - straighten: whether or not to reset rotate
       *          - listen: determine if a callback is needed
       *          
       * @return {null}      null
       */
      _append = function (opts) {
        // Append passed in document fragment to the root element
        rootEl.appendChild(opts.fragment);
        
        // Refresh our cache of items
        _getCards();

        // Reset offset top
        offsetTop = 0;

        // Reset the heights of each columns
        _resetColumnHeights();

        // Re-run layout method and pass along options
        _layout(opts);
      };

      
      /**
       * Kick things off here!
       */
      _init = function (opts) {

        // Populate columnHeights arrays with 0s
        _resetColumnHeights();

        // Set our `instance-wide` items value
        _getCards();

        // Make this happen!
        _layout(opts);
      };


      /**
       * Expose API
       */
      return {
        initialize: _init,
        refresh: _refresh,
        append: _append
      };

    };
    
    return Grid;
  };

  /**
   * Transport
   */
  if (typeof define === 'function' && define.amd) {
    define(['./end-pool'], function (endPool) {
      return GameGrid(endPool)
    });
  } else {
    w.GameGrid = GameGrid(window.endPool);
  }

})(window);