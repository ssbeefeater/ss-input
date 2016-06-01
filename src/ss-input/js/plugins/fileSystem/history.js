(function ($) {
    var back = false;
    Ss_input.fileSystem['history'] = Ss_input.Plugin.extend({
        template: {
            back: '<a href="#" id="ssi-backHistory" class="disabled ssi-historyBack"><div class="icon ssi-backIcon"></div></a>',
            fw: '<a href="#" id="ssi-fwHistory" class="ssi-historyFw disabled"><div class="icon ssi-fwIcon"></div></a>',
            up: '<a href="#" id="ssi-historyUp" class="ssi-historyUp disabled"><div class="icon ssi-upIcon"></div></a>'
        },
        init: function () {
            this.backHistory = [];
            this.fwHistory = [];
            this.setButtons();
            this.setEvents();
        },
        setButtons: function () {
            var thisS = this;
            var $back = $(this.template.back);
            var $fw = $(this.template.fw);
            var $up = $(this.template.up);
            var ssi = this.ssi;
            $back.on('click', function (e) {
                thisS.historyBack($(this));
                return false;
            });
            $fw.on('click', function (e) {
                if (thisS.fwHistory.length > 0)
                    thisS.historyFw($(this));
                return false;
            });
            $up.on('click.ssi', function (e) {
                if (ssi.readOnlyMode)
                    thisS.historyBack();
                else
                    thisS.ssi.fileSystem.scanDir(Ss_input.tools.dirname(ssi.currentCollection.id));
                return false;
            });
            ssi.$content.find('.ssi-topBarButtonArea').append($back, $fw, $up);
        },
        setEvents: function () {
            var thisS = this, ssi = this.ssi;
            ssi.$element.on('echoItemsAction.ssi', function () {
                if (ssi.currentCollection.id !== '/') {
                    thisS.ssi.$content.find('#ssi-historyUp').removeClass('disabled');
                } else {
                    thisS.ssi.$content.find('#ssi-historyUp').addClass('disabled');
                }
                if (back) {
                    back = false;
                    return;
                }
                var length = thisS.backHistory.length;
                if (length > 0 && ssi.currentCollection.id !== '/') {
                    thisS.ssi.$content.find('#ssi-backHistory').removeClass('disabled');
                }
                if (thisS.backHistory[length - 1] !== ssi.currentCollection.id && !ssi.readOnlyMode) {
                    if (length >= 20) thisS.backHistory.shift();
                    thisS.backHistory.push(ssi.currentCollection.id);
                    thisS.fwHistory = [];
                    ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                }
            }).on('closeAction.ssi', function () {
                thisS.backHistory = ['/'];
                thisS.fwHistory = [];
                back = false;
            }).on('removeCollectionAction.ssi', function (e, id) {
                thisS.removeFromHistory(id)
            });
        },
        historyFw: function ($btn) {
            back = true;
            $btn = $btn || this.ssi.$content.find('#ssi-fwHistory');
            var length = this.fwHistory.length;
            this.ssi.$content.find('#ssi-backHistory').removeClass('disabled');
            if (length === 1) $btn.addClass('disabled');
            var data = this.fwHistory[length - 1];
            this.ssi.fileSystem.scanDir(data);
            this.backHistory.push(data);
            this.fwHistory.splice(length - 1, 1);
        },
        historyBack: function ($btn) {
            $btn = $btn || this.ssi.$content.find('#ssi-backHistory');
            back = true;
            var ssi = this.ssi;
            var length = this.backHistory.length;
            if (length < 1)return;
            if (length == 2) $btn.addClass('disabled');
            if (!ssi.readOnlyMode) {
                if (length < 2){
                    $btn.addClass('disabled');
                    return;
                }
                ssi.fileSystem.scanDir(this.backHistory[length - 2]);
                this.fwHistory.push(this.backHistory[length - 1]);
                this.backHistory.splice(length - 1, 1);
                ssi.$content.find('#ssi-fwHistory').removeClass('disabled');
            } else {
                ssi.fileSystem.scanDir(this.backHistory[length - 1]);
                if (length === 1) $btn.addClass('disabled');
            }
        },
        removeFromHistory: function (path) {
            if (this.backHistory.length > 0) {
                Ss_input.tools.removeFromArray(this.backHistory, path);
                Ss_input.tools.removeMirrorValues(this.backHistory);
                if (this.backHistory.length < 2) {
                    this.ssi.$content.find('#ssi-backHistory').addClass('disabled');
                }
            }
            if (this.fwHistory.length > 0) {
                Ss_input.tools.removeFromArray(this.fwHistory, path);
                Ss_input.tools.removeMirrorValues(this.fwHistory);
                if (this.fwHistory.length < 1) {
                    this.ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                } else if (this.fwHistory.length == 1 && this.fwHistory[0] == this.ssi.currentCollection.id) {
                    this.fwHistory = [];
                    this.ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                }
            }
        },
        cleanHistory: function () {
            this.fwHistory = [];
            this.backHistory = [];
        }
    })
})(jQuery);