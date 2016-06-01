(function ($) {
    Ss_input.plugins['select'] = Ss_input.Plugin.extend({
        init: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-selectIcon"></span> ' + this.translate('select'),
                id: '',
                className: '',
                method: function () {
                    thisS.mSelect(ssi.get$mainElement(ssi.plugins['contextMenu'].rightClickItem));
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu']);
            this.selectionList = [];
            this.removeSelectedList();
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi;
            var thisS = this;
            var $btn = ssi.addButton({
                label: '<div class="icon ssi-selectImgIcon"></div>',
                id: '',
                className: 'ssi-selectItem',
                method: function (e) {
                    thisS.mSelect(ssi.get$mainElement($(e.currentTarget)));
                },
                selectionRequired: true
            }, 'itemButton');
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                item.$element.find('div.ssi-optionsDiv').append($btn.clone(true));
            });

            ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                thisS.removeSelectedList();
            });
            ssi.$content.on('click.ssi', '.ssi-selectable', function (e) {
                var $e = $(e.currentTarget);
                if (thisS.options.defaultPreviewType === 'details' && $e.hasClass('ssi-displayDiv'))return;
                e.preventDefault();
                if (e.ctrlKey) {
                    thisS.mSelect(ssi.get$mainElement($e));
                } else {
                    $e = $(e.target);
                    if (thisS.options.defaultPreviewType === 'details' && !$e.is('a') && !$e.parent().is('a'))
                        thisS.removeSelectedList();
                }

            }).on('mousedown.ssi', function (e) {
                var eventTarget;
                if (thisS.selectionList.length > 0) {
                    eventTarget = $(e.target);
                    var docContainer = ssi.$content.find('.ssi-itemWrapper');
                    var isETarget = docContainer.is(e.target);
                    var hasETarget = docContainer.has(e.target).length === 0;
                    var hasMultiOpt = eventTarget.hasClass('ssi-selectionRequired');
                    if (thisS.selectionList.length > 0) {
                        if (!e.ctrlKey) {
                            if (!isETarget && hasETarget && !eventTarget.parents('ul').hasClass('ssi-dropdown') && !hasMultiOpt && !eventTarget.is('a') && !eventTarget.parents('ul').hasClass('custom-menu')) {
                                thisS.removeSelectedList();
                            }
                        }
                    }
                }
            });
        },
        mSelect: function (e) {
            var $e = $(e),
             ssi = this.ssi;
            if (this.selectionList.length == 0) {
                this.ssi.$content.find('.ssi-mustSelect').removeClass('disabled');
                ssi.$content.find('.ssi-selectionRequired').removeClass('ssi-hidden');
            }
            if ($e.hasClass('ssi-mActive')) {
                $e.removeClass('ssi-mActive');
                Ss_input.tools.removeFromArray(this.selectionList, $e.attr('data-ID'));
                if (this.selectionList.length < 1) {
                    ssi.$content.find('.ssi-selectionRequired').addClass('ssi-hidden');
                }
            } else {
                $e.addClass('ssi-mActive');
                var info = $e.data('info');
                this.selectionList.push($e.attr('data-ID'));
            }
            ssi.checkExcludedButtons();
        },
        removeSelectedList: function () {
            var ssi = this.ssi;
            this.selectionList = [];
            ssi.$content.find('.ssi-mActive').removeClass('ssi-mActive');
            ssi.$content.find('.ssi-selectionRequired').addClass('ssi-hidden');
            ssi.$content.find('.ssi-mustSelect').addClass('disabled');
            return this;
        }

    })
})(jQuery);