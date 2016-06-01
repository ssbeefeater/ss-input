(function ($) {
    Ss_input.plugins['nameBubble'] = Ss_input.Plugin.extend({
        init: function () {
            this.setEvents();
        },
        setEvents: function () {
            var time;
            this.ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                if (time)
                    clearTimeout(time);
            });
            this.ssi.$content.on({
                'mouseenter.ssi': function (e) {
                    var $eventTarget = $(e.target);
                    if ($eventTarget.outerWidth() < $eventTarget[0].scrollWidth) {
                        if (!time) {
                            time = setTimeout(function () {
                                Ss_input.tools.tooltip($eventTarget, $eventTarget.html()).css('max-width', '350px');
                            }, 2000)
                        }
                    }
                },
                'mouseleave.ssi': function (e) {
                    if (time) {
                        clearTimeout(time);
                        time = null;
                    }
                }
            }, '.ssi-itemName')
        }
    })
})(jQuery);