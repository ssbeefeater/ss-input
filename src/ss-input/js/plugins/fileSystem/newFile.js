(function ($) {
    Ss_input.fileSystem['newFile'] = Ss_input.Plugin.extend({
        permissions:'write',
        defaults: {
            ajaxOptions: {},
            data: {},
            theme: 'monokai',
            language: 'javascript',
            onShow: function () {
            }
        },
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            ssi.addButton({
                label: '<div class="icon ssi-newFileIcon"></div>',
                title: this.translate('newFile'),
                id: '',
                input: {
                    enterKey: true,
                    containerClass: 'ssi-newFileContainer',
                    className: 'ssi-FileInput ssi-menuInput',
                    placeholder: this.translate('name'),
                    id: 'ssi-fileName',
                    buttons: [{
                        label: '<div class="icon ssi-checkIcon"></div>',
                        className: 'ssi-inBtn ssi-inFolderBtn',
                        method: function (e, value) {
                            thisS.newFile(value);
                        }
                    }]
                },
                className: 'ssi-folderSwitch'
            }, 'menuButton', ['menu']);
            return this;
        },
        newFile: function (name) {
            var ssi = this.ssi, thisS = this;
            if (!name||ssi.readOnlyMode)return;
            var fileSystem=ssi.fileSystem;
            var item = ssi.getItemData('name', name);
            if (item && item.mimeType != 'directory') {
                ssi.notify('error', this.translate('existError'));

                return;
            }
            var ext=Ss_input.tools.getExtension(name);
            if ($.inArray(ext,ssi.fileSystem.options.allowed)==-1) {
                ssi.notify('error',  Ss_input.tools.replaceText(this.translate('extError'),ext));
                return;
            }
            var callback = function () {
                ssi.notify('success', thisS.translate('fileSuccessCreated'));
                ssi.$content.find('#ssi-fileName').val('');
                ssi.$content.find('.ssi-newFileContainer').hide(500);
                var item = {
                    'name': name,
                    'mimeType': 'text/plain',
                    'date': Ss_input.tools.getDate(),
                    'path': fileSystem.getPath(name),
                    'size': 1+' B',
                    'type': Ss_input.tools.getExtension(name)
                };
                ssi.plugins['scan'].appendItems(item);
            };
            this.sendRequest(fileSystem.getPath(name),callback);
            return this;
        },
        sendRequest: function (path,callback) {
            var ssi = this.ssi;
            var data = $.extend({}, this.options.data, {
                filePath: path,
                fileContent: ' '
            });
            var ajaxOptions = $.extend({}, {
                data: data,
                url: ssi.fileSystem.options.scriptsPath + 'newFileAction.php'
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, callback);
            return this;
        },
        da: function () {
            /*
             var a = $('<div id="ssi-aceEditor">function foo(items) { var x = "All this is syntax highlighted";return x;}</div>');
             modal.setContent(a);
             var editor = ace.edit("ssi-aceEditor");
             editor.setTheme("ace/theme/" + thisS.options.theme);
             editor.getSession().setMode("ace/mode/" + thisS.options.language);
             editor.resize();
             if (typeof thisS.options.onShow === 'function')
             thisS.options.onShow(editor)*/
        }
    });
})(jQuery);