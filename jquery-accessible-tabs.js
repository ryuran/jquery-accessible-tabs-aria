/*
 * jQuery Accessible tab panel system, using ARIA
 * Website: http://a11y.nicolas-hoffmann.net/tabs/
 * License MIT: https://github.com/nico3333fr/jquery-accessible-tabs-aria/blob/master/LICENSE
 */
(function ($) {
  'use strict';

  $(function () {
    // Store current URL hash.
    var hash = window.location.hash.replace('#', '');

    /* Tabs ------------------------------------------------------------------------------------------------------------ */
    var $tabs = $('.js-tabs');

    if ($tabs.length) {

      $('.js-tablist', $tabs).each(function () {
        var $tabList = $(this);
        var options = $tabList.data();
        var $tabs_prefix_classes = typeof options.tabsPrefixClass !== 'undefined' ? options.tabsPrefixClass + '-' : '';
        var $hx = typeof options.hx !== 'undefined' ? options.hx : '';
        var $existing_hx = typeof options.existingHx !== 'undefined' ? options.existingHx : '';
        var $tabList_items = $tabList.children('.js-tablist__item');
        var $tabList_links = $tabList.find('.js-tablist__link');

        // roles init
        $tabList.attr('role', 'tablist');              // ul
        $tabList_items.attr('role', 'presentation');   // li
        $tabList_links.attr('role', 'tab');            // a

        // classes init
        $tabList.addClass($tabs_prefix_classes + 'tabs__list');
        $tabList_items.addClass($tabs_prefix_classes + 'tabs__item');
        $tabList_links.addClass($tabs_prefix_classes + 'tabs__link');

        // controls/tabindex attributes
        $tabList_links.each(function () {
          var $this = $(this);
          var $hx_generated_class = typeof options.tabsGeneratedHxClass !== 'undefined' ? options.tabsGeneratedHxClass : 'invisible';
          var href = $this.attr('href');
          var $controls = $(href);
          var $text = $this.text();

          if ($hx !== '') {
            $controls.prepend('<' + $hx + ' class="' + $hx_generated_class + '" tabindex="0">' + $text + '</' + $hx + '>');
          }

          if ($existing_hx !== '') {
            $controls.find($existing_hx + ':first-child').attr('tabindex',0);
          }

          if (typeof href !== 'undefined' && href !== '' && href !== '#') {
            $this.attr({
              'aria-controls': href.replace('#', ''),
              'tabindex': -1,
              'aria-selected': 'false'
            });
          }

          $this.removeAttr('href');
        });
      });

      /* Tabs content ---------------------------------------------------------------------------------------------------- */
      $('.js-tabcontent').attr({
        'role': 'tabpanel',             // contents
        'aria-hidden': 'true'           // all hidden
        // 'tabindex': 0
      })
      .each(function () {
        var $this = $(this),
            this_id = $this.attr('id'),
            prefix_attribute = $('#label_' + this_id).closest('.js-tablist').attr('data-tabs-prefix-class'),
            tabs_prefix_classes = typeof prefix_attribute !== 'undefined' ? prefix_attribute + '-' : '';
        // label by link
        $this.attr('aria-labelledby', 'label_' + this_id);

        $this.addClass(tabs_prefix_classes + 'tabs__content');
      });

      // search if hash is ON tabs
      if (hash !== '' && $('#' + hash + '.js-tabcontent').length !== 0) {
        // display
        $('#' + hash + '.js-tabcontent').removeAttr('aria-hidden');
        // selection menu
        $('#label_' + hash + '.js-tablist__link').attr({
          'aria-selected': 'true',
          'tabindex': 0
        });
      }
      // search if hash is IN tabs
      if (hash !== '' && $('#' + hash).parents('.js-tabcontent').length){
        var $this_hash = $('#' + hash),
            $tab_content_parent = $this_hash.parents('.js-tabcontent'),
            $tab_content_parent_id = $tab_content_parent.attr('id');

        $tab_content_parent.removeAttr('aria-hidden');
        // selection menu
        $('#label_' + $tab_content_parent_id + '.js-tablist__link').attr({
          'aria-selected': 'true',
          'tabindex': 0
        });
      }

      // if no selected => select first
      $tabs.each(function () {
        var $this = $(this),
            $tab_selected = $this.find('.js-tablist__link[aria-selected="true"]'),
            $first_link = $this.find('.js-tablist__link:first'),
            $first_content = $this.find('.js-tabcontent:first');

        if ($tab_selected.length === 0) {
          $first_link.attr({
            'aria-selected': 'true',
            'tabindex': 0
          });
          $first_content.removeAttr('aria-hidden');
        }
      });

      /* Events ---------------------------------------------------------------------------------------------------------- */
      /* click on a tab link */
      $(document).on('click', '.js-tablist__link', function(event) {
        var $this = $(this),
            $hash_to_update = $this.attr('aria-controls'),
            $tab_content_linked = $('#' + $this.attr('aria-controls')),
            $parent = $this.closest('.js-tabs'),
            $all_tab_links = $parent.find('.js-tablist__link'),
            $all_tab_contents = $parent.find('.js-tabcontent');

        // aria selected false on all links
        $all_tab_links.attr({
          'tabindex': -1,
          'aria-selected': 'false'
        });

        // add aria selected on $this
        $this.attr({
          'aria-selected': 'true',
          'tabindex': 0
        });

        // add aria-hidden on all tabs contents
        $all_tab_contents.attr('aria-hidden', 'true');

        // remove aria-hidden on tab linked
        $tab_content_linked.removeAttr('aria-hidden');

        // add fragment (timeout for transitions)
        setTimeout(function () {
          history.pushState(null, null, location.pathname + location.search + '#' + $hash_to_update);
        }, 1000);

        event.preventDefault();
      })
      /* Key down in tabs */
      .on('keydown', '.js-tablist', function (event) {
        var $tabList = $(this).closest('.js-tabs');
        var $activated = $('.js-tablist__link[aria-selected="true"]', $tabList).parent();
        var $last_link = $('.js-tablist__item:last-child .js-tablist__link', $tabList);
        var $first_link = $('.js-tablist__item:first-child .js-tablist__link', $tabList);
        var $target = null;

        // some event should be activated only if the focus is on tabs (not on tabpanel)
        var $focus_on_tab_only = $(document.activeElement).is($('.js-tablist__link', $tabList));

        // catch keyboard event only if focus is on tab
        if ($focus_on_tab_only && !event.ctrlKey) {
          // strike up or left in the tab
          if (event.keyCode === 37 || event.keyCode === 38) {
            // if we are on first => activate last
            $target = $activated.is('.js-tablist__item:first-child') ? $last_link : $activated.prev().children('.js-tablist__link');
          }
          // strike down or right in the tab
          else if (event.keyCode === 40 || event.keyCode === 39) {
            // if we are on last => activate first
            $target = $activated.is('.js-tablist__item:last-child') ? $first_link : $activated.next().children('.js-tablist__link');
          }
          else if (event.keyCode === 36) {
            // activate first tab
            $target = $first_link;
          }
          else if (event.keyCode === 35) {
            // activate last tab
            $target = $last_link;
          }

          if ($target !== null) {
            $target.click().focus();
            event.preventDefault();
          }
        }
      })
      .on('keydown', '.js-tabcontent', function(event) {
        var $this = $(this);
        var $selector_tab_to_focus = $this.attr('aria-labelledby');
        var $tab_to_focus = $('#' + $selector_tab_to_focus);
        var $parent_item = $tab_to_focus.parent();
        var $parent_list = $parent_item.parent();
        var $target = null;

        if (event.ctrlKey) {
          // CTRL up/Left
          if (event.keyCode === 37 || event.keyCode === 38) {
            $tab_to_focus.focus();
            event.preventDefault();
          }
          // CTRL PageUp
          if (event.keyCode === 33) {
            $tab_to_focus.focus();

            // if we are on first => activate last
            if ($parent_item.is('.js-tablist__item:first-child')) {
              $target = $parent_list.find('.js-tablist__item:last-child .js-tablist__link');
            }
            // else activate prev
            else {
              $target = $parent_item.prev().children('.js-tablist__link');
            }

          }
          // CTRL PageDown
          if (event.keyCode === 34) {
            $tab_to_focus.focus();

            // if we are on last => activate first
            if ($parent_item.is('.js-tablist__item:last-child')) {
              $target = $parent_list.find('.js-tablist__item:first-child .js-tablist__link');
            }
            // else activate next
            else {
              $target = $parent_item.next().children('.js-tablist__link');
            }
          }

          if ($target !== null) {
            $target.click().focus();
            event.preventDefault();
          }
        }
      })
      /* click on a tab link */
      .on('click', '.js-link-to-tab', function () {
        var $tab_to_go = $(this.getAttribute('href'));
        var $button_to_click = $('#' + $tab_to_go.attr('aria-labelledby'));

        // activate tabs
        $button_to_click.click();
        // give focus to the good button
        setTimeout(function (){
          $button_to_click.focus();
        }, 10);
      });
    }
  });
})(window.jQuery);
