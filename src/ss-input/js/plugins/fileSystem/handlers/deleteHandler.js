(function ($) {
    Ss_input.fileSystemHandlers['delete'] = Ss_input.Handler.extend({
        init: function () {
            this.defaults = {
                stringifyData: true,
                sendId: 'inForm',
                ajaxOptions: {url: this.storage.options.scriptsPath + '/deletedirAction.php'}
            };
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            this.ssi.$element.on('removeItemAction.ssi', function (e, id) {
                if (!id.isFile(ssi.fileSystem.options.allowed)) {
                    thisS.ssi.$element.trigger('removeCollectionAction.ssi', [id.replace(ssi.fileSystem.options.rootPath, '')]);
                    var sideBar = ssi.plugins['sidebar'];
                    if (sideBar) {
                        sideBar.deleteTree(id);
                    }
                }
            })
        }
    })
})(jQuery);