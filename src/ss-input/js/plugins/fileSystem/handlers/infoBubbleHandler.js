(function ($) {
    Ss_input.fileSystemHandlers['infoBubble'] = Ss_input.Handler.extend({
        defaults: {
            excludeFields: ['ext', 'name','path'],
            includeFields: [],
            excludeItems: 'condition:(field:(mimeType)=="directory")',
            translateFields: true
        }
    })
})(jQuery);