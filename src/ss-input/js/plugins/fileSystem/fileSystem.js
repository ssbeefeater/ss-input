(function ($) {
    Ss_input.fileSystem = [];
    Ss_input.fileSystemHandlers = [];
    Ss_input.storageTypes['fileSystem'] = Ss_input.Plugin.extend({
        type: 'corePlugins',

        defaults: {
            allowed: ['jpg', 'jpeg', 'png'],
            scriptsPath: '',
            rootPath: '',
            responseValidation:{
                validationKey: 'type',
                resultKey: 'msg',
                success: 'success',
                error: 'error'
            }
        },
        constructor: function (ss_input, options) {
            this.options = $.extend({}, this.defaults, options);
            this.ssi = ss_input;
            ss_input.handlersGroup = 'fileSystemHandlers';
            this.pluginNames = [];
            ss_input.options.responseValidation=this.options.responseValidation;
            for (var pluginName in Ss_input.fileSystem) {
                this.pluginNames.push(pluginName);
            }
            this.setEvents();
        },
        setEvents: function () {
            var thisS = this, ssi = this.ssi;
            this.ssi.$element.on('showAction', function () {
                thisS.scanDir(thisS.options.rootPath + '/');
                thisS.ssi.pluginInit(thisS.pluginNames, Ss_input.fileSystem);
                thisS.ssi.$content.on('click.ssi', '.directory', function (e) {
                    var $e = $(e.target);
                    if (e.ctrlKey || $e.is('a') || $e.parent().is('a')) return;
                    var id = ssi.getId($e);
                    thisS.scanDir(id);

                    return false;
                });
            }).on('removeItemAction.ssi', function (e, data) {
                if (!Ss_input.tools.isFile(data,thisS.options.allowed))
                    $(this).trigger('removeCollectionAction.ssi', [data.replace(thisS.options.rootPath, '')]);
            });
            return this;
        },
        getPath: function (name, type) {
            type = type || 'relative';
            name = name || '';
            var path = Ss_input.tools.urlUnion(this.options.rootPath + (this.ssi.currentCollection.id || '/'), name);
            if (type === 'relative') {
                return path;
            } else {
                return Ss_input.tools.urlUnion(path = document.location.protocol + '//' + window.location.hostname, path);
            }
        },
        scanDir: function (url) {
            url = url.replace(this.options.rootPath, '');
            this.ssi.openCollection(url, this.options.scriptsPath + '/scanAction.php', {
                'currentDir': this.options.rootPath + url
            });

        },
    });
})(jQuery);