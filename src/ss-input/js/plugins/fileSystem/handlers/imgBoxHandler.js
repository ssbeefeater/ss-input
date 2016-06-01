(function ($) {
    Ss_input.fileSystemHandlers['imgBox'] = Ss_input.Handler.extend({
        defaults: {
            excludeItems: 'condition:(field:(mimeType).split("/")[0]!="image")',
            imageField: 'path'
        }
    })
})(jQuery);