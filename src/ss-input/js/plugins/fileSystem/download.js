(function ($) {
    Ss_input.fileSystem['download'] = Ss_input.Plugin.extend({
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-downloadIcon"></span>' + this.translate('download'),
                method: function () {
                    thisS.download();
                },
                className: 'ssi-openInBtn',
                selectionRequired: true
            }, 'listButton', ['contextMenu'], 'condition:(field:(mimeType)!="directory")');
        },
        download: function () {
            var ssi = this.ssi;
            var files = ssi.getSelectedField('name');
            var filesLength = files.length;
            for (var i = 0; i < filesLength; i++) {
                var name = ssi.getSelectedField('name')[i];
                var link = document.createElement("a");
                link.download = name;
                link.href = ssi.fileSystem.getPath(name);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                delete link;
            }
        }
    });
})(jQuery);