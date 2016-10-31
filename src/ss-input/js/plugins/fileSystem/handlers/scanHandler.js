(function ($) {
    Ss_input.fileSystemHandlers['scan'] = Ss_input.Handler.extend({
        group: 'fileSystem',
        defaults: {
            titleField:'name',
            idField: 'path',
            displayImage: 'condition:(field:(mimeType).split("/")[0]=="image"? field:(path):"")',
            itemClass: 'condition:(field:(mimeType).split("/")[0]=="image"||field:(mimeType).split("/")[0]=="directory"?field:(mimeType).split("/")[0]:field:(mimeType).split("/")[0]+" ssi-empty")'
        }
    })
})(jQuery);