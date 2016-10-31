(function ($) {
    Ss_input.database['editRecord'] = Ss_input.Plugin.extend({
        permissions: 'edit',
        template: {
            form: '<form id="ssi-formData"><table><#=formItem#></table></form>',
            formItem: '<tr><th><label for="<#=inputId#>" class="<#=labelClass#>"><#=label#></label></th><td><#=input#></td></tr>'
        },
        defaults: {
            sendId: 'inUrl',
            ajaxOptions: {
                stringifyData: true,
                contentType: "application/json"
            },
            data: {}
        },
        init: function () {
            this.database = this.ssi.database;
            this.setButtons();
        },
        setEvents: function () {
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-editDocumentIcon"></span> ' + this.translate('editDocument'),
                id: '',
                className: 'ssi-editFile',
                method: function (e) {
                    thisS.edit(thisS.ssi.getSelectedData()[0]);
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu']);
        },
        edit: function (data) {
            var ssi = this.ssi, thisS = this;
            var content = $(this.database.getForm(data));
            if (this.options.sendId == 'inForm') {
                content.append('<input type="hidden" class="ssi-inputField" name="' + this.database.id + '" value="' + data[this.database.currentCollection.id] + '">');
            }
            if (ssi.checkPermissions('write', 'saveAsNew'))
                var topButton = {
                    title: this.translate('saveAsNew'),
                    label: '<div class="icon ssi-saveIcon"></div>+',
                    method: function () {
                        thisS.save(data[thisS.database.currentCollection.id], function (data, textStatus, xhr, formData) {
                            if (xhr.status == 201 || xhr.status == 200) {
                                ssi.plugins['scan'].appendItems((typeof data === 'object' && data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                                ssi.notify('success', thisS.translate('successSave'))
                            }
                        }, {
                            url: thisS.database.currentCollection.baseUrl.replace('/:id', ''),
                            type: 'POST'
                        });
                    }
                };
            var modalOptions = {
                content: content[0].outerHTML,
                buttons: [{
                    label: '<div class="icon ssi-saveIcon"></div>&nbsp;' + this.translate('save'),
                    closeAfter: false,
                    className: 'ssi-mBtn',
                    method: function (e, modal) {
                        var id = data[thisS.database.currentCollection.id];
                        thisS.save(id, function (data, textStatus, xhr, formData) {
                            if (xhr.status == 200) {
                                if (modal)
                                    modal.close();
                                ssi.plugins['scan'].resetItem(id, (typeof data === 'object' && data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                                ssi.notify('success', thisS.translate('successSave'));
                            }
                        });
                    }
                }]
            };

            this.database.createWindow(modalOptions, topButton);
        },
        save: function (id, callback, options) {
            var formData = this.database.getFormData();
            if (!formData)return;
            var ssi = this.ssi, url;
            var data = $.extend({}, this.options.data, formData);
            if (this.options.sendId == 'inUrl') {
                url = (this.database.currentCollection.baseUrl.indexOf('/:id') == -1 ? this.database.currentCollection.baseUrl + '/' + id : this.database.currentCollection.baseUrl.replace(':id', id));
            } else {
                url = this.database.currentCollection.baseurl;
            }
            var ajaxOptions = $.extend({}, {
                data: data,
                type: 'PUT',
                url: url
            }, options, this.options.ajaxOptions);

            ssi.ajaxCall(ajaxOptions, function (data, textStatus, xhr) {
                if (typeof callback === 'function') {
                    callback(data, textStatus, xhr, formData);
                }
            });
            return this;
        }
    })
})(jQuery);