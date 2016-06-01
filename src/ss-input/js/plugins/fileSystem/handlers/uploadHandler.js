(function ($) {
    var ssi_uploadedFiles = [];
    Ss_input.fileSystemHandlers['upload'] = Ss_input.Handler.extend({
        group: ['fileSystem'],
        extend: {
            onEachUpload: function (fileInfo) {
                var thisS = this;
                if (fileInfo.uploadStatus === 'success') {
                    var name = fileInfo.name.replace(' ', '-');
                    var item = {
                        'name': name,
                        'mimeType': fileInfo.type,
                        'date': Ss_input.tools.getDate(),
                        'path': thisS.ssi.fileSystem.getPath(name),
                        'size': fileInfo.size,
                        'ext': Ss_input.tools.getExtension(fileInfo.name),
                        'dimensions': 'unknown'
                    };
                    ssi_uploadedFiles.push(item);
                }
            }
        },
        init: function () {
            this.setEvents();
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('uploadCloseAction.ssi', function () {
                thisS.appendItems();
            });
        },
        appendItems: function () {
            if (ssi_uploadedFiles.length)
                this.ssi.plugins['scan'].appendItems(ssi_uploadedFiles);
            ssi_uploadedFiles = [];
            this.ssi.$element.trigger('resetAction');
        }
    })
})(jQuery);