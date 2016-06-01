(function ($) {
    Ss_input.database['newRecord'] = Ss_input.Plugin.extend({
        permissions: 'write',
        defaults: {
            ajaxOptions: {
                stringifyData: true,
                contentType: "application/json"
            },
            data: {}
        },
        init: function () {
            this.database = this.ssi.corePlugins['database'];
            this.setButtons();
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<div class="icon ssi-newDocumentIcon"></div>',
                title: this.translate('newDocument'),
                method: function () {
                    thisS.addNew();
                }
            }, 'menuButton', ['menu']);
        },
        addNew: function () {
            var ssi = this.ssi, thisS = this;
            var content = this.database.getForm();
            var topButtons = [{
                title: this.translate('saveAndNew'),
                label: '<div class="icon ssi-saveIcon"></div>+',
                method: function () {
                    thisS.save(function (data, textStatus, xhr) {
                        if (xhr.status == 201) {
                            thisS.database.resetForm();
                            ssi.notify('success', thisS.translate('successSave'))
                        }
                    });
                }
            }];
            var modalOptions = {
                content: content,
                buttons: [{
                    label: '<div class="icon ssi-saveIcon"></div>&nbsp;' + this.translate('save'),
                    closeAfter: false,
                    className: 'ssi-mBtn',
                    method: function (e, modal) {
                        thisS.save(function (data, textStatus, xhr) {
                            if (xhr.status == 201 || xhr.status == 200) {
                                if (modal)
                                    modal.close();
                                ssi.notify('success', thisS.translate('successSave'))
                            }
                        });
                    }
                }]
            };
            this.database.createWindow(modalOptions, topButtons);
        },
        save: function (callback) {
            var formData = this.database.getFormData();
            if (!formData)return;
            var ssi = this.ssi,thisS=this;
            var data = $.extend({}, this.options.data, formData);
            var ajaxOptions = $.extend({}, {
                data: data,
                url: this.database.currentCollection.baseUrl.replace('/:id', '')
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, function (data, textStatus, xhr) {
                if (xhr.status == 201 || xhr.status == 200) {
                    ssi.plugins['scan'].appendItems((typeof data === 'object'&&data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                }
                if (typeof callback === 'function') {
                    callback(data, textStatus, xhr, formData)
                }
            });
            return this;
        }
    })
})(jQuery);