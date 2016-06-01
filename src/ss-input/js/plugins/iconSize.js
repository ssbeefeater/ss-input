(function ($) {
    Ss_input.plugins['iconSize'] = Ss_input.Plugin.extend({
        defaults: {
            defaultSize: 'small'
        },
        init: function () {
            this.sizeClass = {
                'large': 'ssi-mImgL',
                'medium': '',
                small: 'ssi-mImgS'
            };
            this.setButtons()
             .setEvents();
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-sizeIcon"></span> ' + this.translate('iconSize'),
                id: '',
                className: '',
                subMenu: [{
                    label: '<span class="ssi-letterIcon">S</span> ' + this.translate('small'),
                    method: function () {
                        thisS.options.defaultSize = 'small';
                        thisS.setIcons();
                    }
                }, {
                    label: '<span class="ssi-letterIcon">M</span> ' + this.translate('medium'),
                    method: function () {
                        thisS.options.defaultSize = 'medium';
                        thisS.setIcons();
                    }
                }, {
                    label: '<span class="ssi-letterIcon">L</span> ' + this.translate('large'),
                    method: function () {
                        thisS.options.defaultSize = 'large';
                        thisS.setIcons();
                    }
                }]
            }, 'listButton', ['options']);
            return this;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                item.$element.addClass(thisS.sizeClass[thisS.options.defaultSize])
            });
            return this;
        },
        setIcons: function (size) {
            size = size || this.options.defaultSize;
            this.ssi.$content.find('.ssi-itemWrapper').removeClass('ssi-mImgL ssi-mImgS').addClass(this.sizeClass[size]);
            return this;
        }

    })
})(jQuery);

/*





 */