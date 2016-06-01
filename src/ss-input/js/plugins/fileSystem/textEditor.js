(function ($) {
    Ss_input.fileSystem['textEditor'] = Ss_input.Plugin.extend({
        defaults: {
            ajaxOptions: {},
            data: {},
            pathField: 'path',
            modalOptions: {
                preview: {
                    icon: true,
                    state: 'normal',
                    hideIcons: true
                }
            },
            readOnly: ''
        },
        init: function () {
            this.modalOptions = {
                className: 'ssi-filePreview',
                fixedHeight: true,
                buttons: [],
                outSideClose: false,
                sizeClass: 'large',
                fitScreen: true
            };
            this.path = '';
            this.setModal();
            this.setButtons()
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-editFileIcon"></span> ' + this.translate('textEditor'),
                id: '',
                className: 'ssi-editFile',
                method: function (e) {
                    thisS.path = thisS.ssi.getSelectedField('path')[0];
                    thisS.openFile(thisS.path);
                },
                selectionRequired: true
            }, 'listButton', ['openWith'], 'condition:(field:(mimeType)=="text/plain")');
        },
        setModal: function () {
            var thisS = this;
            $.extend(this.modalOptions, this.options.modalOptions);
            if (this.ssi.checkPermissions('edit', 'editFiles')) {
                this.modalOptions.buttons.push({
                    label: this.translate('save'),
                    method: function () {
                        thisS.saveFile(thisS.getPath(), thisS.getContent());
                    }
                }, {
                    label: thisS.translate('cancel'),
                    closeAfter: true
                });
            } else {
                this.options.readOnly = this.options.readOnly || true;
            }
        },
        openFile: function (path, done) {
            var thisS = this;
            var callback = function (data) {
                var $textArea = $('<textarea id="ssi-textArea" class="ssi-textArea" ' + (thisS.options.readOnly ? 'readonly' : '') + '>' + data + '</textarea>');
                thisS.createWindow($textArea, Ss_input.tools.basename(path));
                if (typeof done == 'function')
                    done($textArea);
            };
            this.sendRequest(path, '', callback, 'GET')
        },
        saveFile: function (path, content) {
            var thisS = this;
            var callback = function (data) {
                thisS.ssi.notify('success', data)
            };
            this.sendRequest(path, content, callback, 'UPDATE');
            return this;
        },
        createWindow: function (content, title) {
            this.modalOptions.content = content;
            this.modalOptions.title = title;
            this.uniqueId = 'ssi-normalModal' + this.ssi.createWindow(this.modalOptions).numberId;
            return this;
        },
        sendRequest: function (path, content, callback, method) {
            var ssi = this.ssi;
            var data = $.extend({}, this.options.data, {
                filePath: path,
                fileContent: content
            });
            var ajaxOptions = $.extend({}, {
                data: data,
                type: method,
                url: ssi.fileSystem.options.scriptsPath + '/' + 'editFileAction.php'
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, callback);
            return this;
        },
        getContent: function () {
            return $('#' + this.uniqueId).find('#ssi-textArea').val()
        },
        getPath: function () {
            return this.path;
        }
    });
})(jQuery);