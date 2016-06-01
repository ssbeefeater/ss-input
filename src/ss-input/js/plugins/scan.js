(function ($) {
    Ss_input.plugins['scan'] = Ss_input.Plugin.extend({
        require: ['templateManager'],
        defaults: {
            titleField: 'title',
            idField: 'id',
            displayImage: '',
            itemClass: '',
            data: {},
            ajaxOptions: {}
        },
        init: function () {
            var ssi = this.ssi;
            ssi.plugins['templateManager'].scan = this;
            this.selectedTemplate = {};
            this.setEvents();
        },
        scanCollection: function (id, url, data) {
            if (!url)return;
            id = id || '/';//Ss_input.tools.basename(url);
            var ssi = this.ssi, thisS = this;
            ssi.currentCollection = {id: id, url: url, data: data};
            var cache = ssi.plugins['cache'];
            if (cache) {
                var cachedPage = cache.getCachedPage(id);
            }
            if (!cachedPage) {
                ssi.readyState = false;
                var callback = function (data) {
                    var page = {id: id, data: data};
                    ssi.$element.trigger('beforeScanAction.ssi', page);
                    if (!ssi.abort) {
                        thisS.echoFiles(page);
                    }
                    ssi.$element.trigger('scanAction.ssi', page);
                    ssi.abort = false;
                    ssi.readyState = true;
                };
                data = $.extend({}, thisS.options.data, data);
                var ajaxOptions = $.extend({}, {
                    'data': data,
                    type: 'GET'
                }, this.options.ajaxOptions);
                ajaxOptions.url = url || ajaxOptions.url;
                ssi.ajaxCall(ajaxOptions, callback, function () {
                    ssi.readyState = true;
                });
            } else {
                this.echoFiles(cachedPage);
            }
            return this;
        },
        echoFiles: function (page, viewOnly, silent) {
            if(!page)return;
            var ssi = this.ssi;
            ssi.readOnlyMode = !!viewOnly || !!ssi.currentCollection['readOnly'];
            var data = page.data;
            if (!data)return;
            ssi.$element.trigger('beforeEchoItemsAction.ssi', page);
            for (var i = 0, items = [], length = data.length; i < length; ++i) {
                items.push(this.filesToDOM(data[i]));
            }
            var content = $(this.selectedTemplate.wrapper).append(items);
            ssi.$content.find('#ssi-contentFiles').html(content);
            if (silent)
                ssi.$element.trigger('silentEchoItemsAction.ssi');
            else
                ssi.$element.trigger('echoItemsAction.ssi');
        },
        reEchoItems: function () {
            var ssi = this.ssi;
            this.echoFiles({
                id: ssi.currentCollection.id,
                data: ssi.getPageData()
            });
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('changeSchemaAction.ssi', function (e, data) {
                thisS.options.titleField = data['displayName'];
                thisS.options.idField = data['id'];
                thisS.options.displayImage = data['displayImage'];
            });
        },
        filesToDOM: function (data, displayName) {
            var ssi = this.ssi;
            var item = {};
            var previewImage = eval(Ss_input.tools.dataReplace(this.options.displayImage));
            item.$element = $(ssi.plugins['templateManager'].getTemplate(data, displayName));
            var displayDiv = item.$element.find('div.ssi-displayDiv');
            Ss_input.tools.loadImage(displayDiv, previewImage);
            item.$element.find('.ssi-mainElement').data('info', data);
            item.data = data;
            ssi.$element.trigger('appendItemAction.ssi', item);
            return item.$element;
        },
        appendItems: function (data, method, $element) {
            $element = $element || this.ssi.$content.find('#ssi-itemsWrapper');
            method = method || 'append';
            data = Ss_input.tools.toArray(data);
            for (var i = 0, content = [], length = data.length; i < length; ++i) {
                content.push(this.filesToDOM(data[i]));
            }
            if (method == 'html')
                this.emptyPage($element);
            $element[method](content);
            this.ssi.$element.trigger('appendItemSetAction.ssi', [data]);
        },
        emptyPage: function ($element) {
            $element = $element || this.ssi.$content.find('#ssi-contentFiles');
            $element.empty();
            this.ssi.$element.trigger('emptyPageAction.ssi');
        },
        resetItem: function (id, data) {
            data = $.extend({}, this.ssi.get$mainElementById(id).data('info'), data);
            this.removeItems(id);
            this.appendItems(data);
        },
        removeItems: function (id) {
            var ssi = this.ssi;
            id = Ss_input.tools.toArray(id);
            for (var i = 0, length = id.length; i < length; i++) {
                var obj = id[i];
                ssi.get$itemWrapper(ssi.get$mainElementById(obj)).remove();
                ssi.$element.trigger('removeItemAction', [obj]);
            }
        }
    });

})(jQuery);