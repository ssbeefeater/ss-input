(function ($) {
    var ssi_totalProgress = [];
    Ss_input.plugins['delete'] = Ss_input.Plugin.extend({
        permissions: 'edit',
        defaults: {
            sendId: 'inForm',
            ajaxOptions: {},
            onDelete: function () {
            },
            data: {}
        },
        init: function () {
            this.setEvents();
            this.setButtons();
            this.baseurl = this.options.ajaxOptions.url;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('resetAction.ssi', function () {
                ssi_totalProgress = [];
            });
            this.ssi.$element.on('changeSchemaAction.ssi', function (e, data) {
                thisS.baseurl = data['url'];
            });
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-deleteIcon"></span> ' + this.translate('delete') + ' <span class="ssi-keyShort">del</span>',
                id: '',
                keyPress: {keyCode: '46'},
                className: '',
                method: function () {
                    thisS.deleteFiles();
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu', 'actions']);
        },
        idInUrl: function (ssi_delItem) {
            for (var i = 0, length = ssi_delItem.length; i < length; i++) {
                if (!ssi_delItem[i]) {
                    console.log('Id is required. Try to refresh the data!');
                    continue;
                }
                this.options.ajaxOptions.url = (this.baseurl.indexOf('/:id') == -1 ? this.baseurl + '/' + ssi_delItem[i] : this.baseurl.replace(':id', ssi_delItem[i]));
                this.sendRequest('', this.deleteCallback(ssi_delItem[i]));
            }
        },
        deleteCallback: function (item) {
            var thisS = this;
            return function (data, textStatus, xhr) {
                if (xhr.status > 200 || 204) {
                    thisS.ssi.plugins['scan'].removeItems(item);
                    thisS.ssi.$element.trigger('resetAction.ssi');
                }
                thisS.ssi.$element.trigger('deleteAction.ssi',item);
                if (typeof thisS.options.onDelete === 'function') {
                    thisS.options.onDelete(data, textStatus, xhr, item)
                }
            };
        },
        sendRequest: function (data, callback) {
            data = data || {};
            data = $.extend({}, this.options.data, data);
            var ajaxOptions = $.extend({},
             {
                 data: data,
                 type: "DELETE",
                 url: ''
             }, this.options.ajaxOptions);
            this.ssi.ajaxCall(ajaxOptions, callback);
        },
        idInForm: function (ssi_delItem) {
            this.sendRequest({
                id: ssi_delItem
            }, this.deleteCallback(ssi_delItem));
        },
        deleteDir: function (ssi_delItem) {
            if (!ssi_delItem.length) {
                return;
            }
            if (this.options.sendId == 'inUrl') {
                this.idInUrl(ssi_delItem);
            } else {
                this.idInForm(ssi_delItem);
            }
        },
        deleteFiles: function () {
            var ssi = this.ssi,
             thisS = this,
             ssi_delItem = ssi.getUrlList();
            if (!ssi_delItem || ssi_delItem.length === 0) {
                return;
            }
            ssi.createWindow({
                sizeClass: 'dialog',
                fixedHeight: false,
                className: "ssi-confirmModal",
                content: this.translate('deleteMsg'),
                buttons: [{
                    label: this.translate('cancel'),
                    className: "ssi-mBtn ssi-cancel",
                    closeAfter: true
                }, {
                    label: this.translate('ok'),
                    className: "ssi-mBtn",
                    closeAfter: true,
                    focused: true,
                    method: function () {
                        thisS.deleteDir(ssi_delItem);
                    }
                }]
            });
        }
    })
})(jQuery);