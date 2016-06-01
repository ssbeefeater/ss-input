(function ($) {
    Ss_input.plugins['selectAll'] = Ss_input.Plugin.extend({
        defaults: {
            selectableClasses: {},
            translateFields:''
        },
        require: ['select'],
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            this.options.translateFields = this.options.translateFields || ssi.options.translateFields;
            var buttons = [{
                label: '<span class="icon ssi-selectAllIcon"></span> ' + this.translate('all') + ' <span class="ssi-keyShort">ctrl + a</span>',
                method: function () {
                    thisS.select('ssi-selectable');
                },
                keyPress: {
                    keyCode: '65',
                    ctrl: true
                }
            }];
            for (var alias in this.options.selectableClasses) {
                buttons.push({
                    label: '<span class="ssi-letterIcon">' + alias[0] + '</span><span class="ssi-title"> ' + this.translate(alias,this.options.translateFields) + '</span>',
                    attributes: {'data-ssi_title': alias},
                    method: function () {
                        thisS.select(thisS.options.selectableClasses[$(this).attr('data-ssi_title')]);
                    }
                })
            }
            ssi.addButton({
                label: '<span class="icon ssi-selectionIcon"></span> ' + this.translate('select'),
                id: '',
                className: '',
                subMenu: buttons
            }, 'listButton', ['options']);
        },
        select: function (selection) {
            var ssi = this.ssi;
            var mainTable = ssi.$content.find('.' + selection);
            var items = mainTable.find('.ssi-selectable');
            if (!items.length)items = mainTable;
            var length = items.length;
            var select = ssi.plugins['select'];
            select.removeSelectedList();
            items.addClass('ssi-mActive');
            if (length > 0) {
                ssi.$content.find('.ssi-selectionRequired').removeClass('ssi-hidden');
                ssi.$content.find('.ssi-mustSelect').removeClass('disabled');
            }
            for (var i = 0; i < length; i++) {
                select.selectionList.push($(items[i]).attr('data-ID'));
            }
        }

    })
})(jQuery);

/*





 */