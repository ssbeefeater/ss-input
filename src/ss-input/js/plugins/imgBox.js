(function ($) {
    Ss_input.plugins['imgBox'] = Ss_input.Plugin.extend({
        defaults: {
            excludeItems: '',
            imageField: ''

        }, init: function () {
            this.setEvents();
        }, setEvents: function () {
            var Button = this.getButton('', 'contentImages'+this.ssi.uniqueId);
            var thisS = this;
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                if (thisS.options.imageField && item.data[thisS.options.imageField] && (!thisS.options.excludeItems || eval(Ss_input.tools.dataReplace(thisS.options.excludeItems, "item.data")) == 'false')) {
                    item.$element.find('div.ssi-optionsDiv').append(Button.clone(true).attr('href', item.data[thisS.options.imageField]));
                }
            }).on('changeSchemaAction.ssi', function (e, data) {
                if (data['displayImage'] && data['displayImage'].indexOf('field:(') > -1&& data['displayImage'].indexOf('condition:(') == -1)
                    thisS.options.imageField = data['displayImage'].replace(/field:\((.*)\)/, '$1');
            });
        },
        getButton: function (href, group) {
            return this.ssi.addButton({
                label: '<div class="icon ssi-imgBoxIcon"></div>',
                id: '',
                stopPropagation: false,
                className: 'ssi-imgBox',
                attributes: {'data-ssi_imgGroup': group, href: href}
            }, 'itemButton', false);
        }
    })
})(jQuery);