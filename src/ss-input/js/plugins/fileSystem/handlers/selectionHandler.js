(function ($) {
    Ss_input.fileSystemHandlers['selection'] = Ss_input.Handler.extend({
        group: 'fileSystem',
        defaults: {
            pathType: 'relative',
            excludeItems: 'condition:(field:(mimeType)=="directory")',
            modeOptions: {
                selectionField: 'path'
            }
        }, init: function () {
            var plugin = this.plugin;
            this.ssi.$element.on('selectionAction.ssi', function (e, selectedInfo) {
                if (plugin.options.pathType == 'absolute') {
                    selectedInfo.selection = document.location.protocol + '//' + window.location.hostname + selectedInfo.selection
                }
            });
        }
    })
})(jQuery);