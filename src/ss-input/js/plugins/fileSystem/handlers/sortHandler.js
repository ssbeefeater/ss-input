(function ($) {
    Ss_input.fileSystemHandlers['sort'] = Ss_input.Handler.extend({
        defaults: {
            sortType: 'asc',
            sortBy: 'ext',
            sortableFields: ['ext', 'name', 'date']
        }
    })
})(jQuery);