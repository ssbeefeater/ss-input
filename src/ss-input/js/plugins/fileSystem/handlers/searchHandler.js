(function ($) {
    Ss_input.fileSystemHandlers['search'] = Ss_input.Handler.extend({
        group: ['fileSystem'],
        init: function () {
            this.defaults={
                searchFields: ['name', 'ext', 'mimeType'],
                deepSearch:{
                    multiple:false,
                    data:{
                        'rootPath': this.ssi.fileSystem.options.rootPath + '/'
                    },
                    ajaxOptions:{
                        url: this.ssi.fileSystem.options.scriptsPath + '/deepSearchAction.php'
                    }
                }

            }
        }
    })
})(jQuery);