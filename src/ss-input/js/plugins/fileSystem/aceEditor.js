(function ($) {
    Ss_input.fileSystem['aceEditor'] = Ss_input.Plugin.extend({
        externalResources: ['ace', 'ace.require("ace/ext/modelist")'],
        defaults: {
            theme: 'monokai',
            config:function(){}
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-aceEditorIcon"></span> ' + this.translate('aceEditor'),
                id: '',
                className: 'ssi-editFile',
                method: function () {
                    thisS.path=thisS.ssi.getSelectedField('path')[0];
                    thisS.openFile(thisS.path);
                },
                selectionRequired: true
            }, 'listButton', ['openWith','actions'], 'condition:(field:(mimeType)=="text/plain")');
            this.modalOptions.className+=' ssi-aceEditor';
        },
        openFile: function (path, done) {
            var thisS = this;
            var callback = function (data) {
                var $textArea = '<div class="ssi-textArea" id="ssi-aceEditor">' + data + '</div>';
                thisS.createWindow($textArea, Ss_input.tools.basename(path));
                thisS.setEditor(path);
                if (typeof done == 'function')
                    done($textArea);
            };
            this.sendRequest(path, '', callback, 'GET')
        },
        setEditor: function (path) {
            var thisS = this, ssi = this.ssi;
            this.editor = editor = ace.edit("ssi-aceEditor");
            if (this.options.readOnly)
                editor.setReadOnly(true);
            editor.setTheme("ace/theme/" + thisS.options.theme);
            editor.$blockScrolling = 'Infinity';
            var session = editor.session;
            session.setMode(ace.require("ace/ext/modelist").getModeForPath(path).mode);
            editor.resize();
            if(typeof this.options.config==='function'){
                this.options.config(editor);
            }
        },
        getContent: function () {
            return this.editor.getValue();
        },
        getPath: function () {
            return this.path;
        }
    }, 'textEditor',Ss_input.fileSystem);
})(jQuery);
