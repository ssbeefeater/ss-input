(function ($) {
    Ss_input.fileSystemHandlers['selectAll'] = Ss_input.Handler.extend({
        group: ['fileSystem'],
        defaults: {
            selectableClasses: {folders:'directory',images:'image',textFiles:'text'},
            translateFields:true
        }
    })
})(jQuery);