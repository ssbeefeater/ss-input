(function ($) {
    Ss_input.plugins['cache'] = Ss_input.Plugin.extend({
        defaults: {
            cacheLimit: 5,
            cacheTo: 'localStorage'
        },
        init: function () {
            var ssi = this.ssi, thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-cacheIcon"></span> ' + this.translate('cleanCache'),
                id: '',
                className: '',
                method: function () {
                    thisS.cleanHistory();
                }
            }, 'listButton', ['options']);
            this.cachedPages = [];
            if (this.options.cacheLimit < 1) {
                this.options.cacheLimit = 1;
            }
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            ssi.$element.on('closeAction.ssi', function () {
                sessionStorage.removeItem("historyCache" + ssi.uniqueId);
                thisS.cachedPages = [];
            }).on('scanAction.ssi', function (e, page) {
                thisS.cachePage(page);
            }).on('emptyPageAction.ssi', function () {
                var historyCache = this.getCache();

                thisS.getCachedPage(thisS.ssi.currentCollection.id, historyCache).data = [];
                thisS.setCache(historyCache);
            }).on('appendItemSetAction.ssi', function (e, data) {
                var historyCache = thisS.getCache();
                var cachedPage = thisS.getCachedPage('', historyCache);
                cachedPage.data = cachedPage.data.concat(data);
                thisS.setCache(historyCache);

            }).on('removeItemAction.ssi', function (e, id) {
                thisS.removeCachedItem(thisS.ssi.plugins['scan'].options.idField, id);
            }).on('removeCollectionAction.ssi', function (e, id) {
                thisS.removeCachedPage(id)
            });

        },
        getCache: function () {
            try {
                return this.options.cacheTo == 'localStorage' ? JSON.parse(sessionStorage.getItem("historyCache" + this.ssi.uniqueId)) || [] : this.cachedPages;
            } catch (e) {
                //removeIf(production)
                console.log(e);
                //endRemoveIf(production)
                return [];
            }
        },
        setCache: function (data) {
            if (this.options.cacheTo != 'localStorage')return this;
            try {
                sessionStorage.setItem("historyCache" + this.ssi.uniqueId, JSON.stringify(data));
                return this;
            } catch (e) {
                //removeIf(production)
                console.log(e);
                //endRemoveIf(production)
                return false;
            }
        },
        removeCachedPage: function (id, historyCache) {
            historyCache = historyCache || this.getCache();
            Ss_input.tools.removeObjFromArray(historyCache, 'id', id);
            this.setCache(historyCache);
            return this;
        },
        removeCachedItem: function (key, value, page, historyCache) {
            key = key || 'name';
            historyCache = historyCache || this.getCache();
            if (typeof page === 'string' && page !== '') {
                page = this.getCachedPage(page, historyCache);
            } else {
                page = page || this.getCachedPage(this.ssi.currentCollection.id, historyCache);
            }
            if (page) {
                Ss_input.tools.removeObjFromArray(page.data, key, value);
                this.setCache(historyCache);
            }
            return this;
        },
        cachePage: function (data, historyCache) {
            historyCache = historyCache || this.getCache();
            if (historyCache.length >= this.options.cacheLimit) {
                historyCache.shift();
            }
            historyCache.push(data);
            this.setCache(historyCache);
            return this.ssi;
        },
        cacheItem: function (item, page, historyCache) {
            historyCache = historyCache || this.getCache();
            if (typeof page === 'string' && page !== '') {
                page = this.getCachedPage(page, historyCache);
            } else {
                page = page || this.getCachedPage(this.ssi.currentCollection.id, historyCache);
            }
            if (page) {
                page.data.push(item)
            }
            this.setCache(historyCache);
            return this.ssi;
        },
        getCachedPage: function (path, historyCache) {
            historyCache = historyCache || this.getCache();
            path = path || this.ssi.currentCollection.id || '/';
            return Ss_input.tools.findByKey(historyCache, 'id', path);
        },
        getCachedItem: function (key, value, page, historyCache) {
            historyCache = historyCache || this.getCache();
            if (typeof page === 'string' && page !== '') {
                page = this.getCachedPage(page, historyCache);
            } else {
                page = page || this.getCachedPage(this.ssi.currentCollection.id, historyCache);
            }
            if (page) {
                return Ss_input.tools.findByKey(page.data, 'name', value);
            }
            return false;
        },
        cleanHistory: function () {
            var currentPage = this.getCachedPage();
            sessionStorage.removeItem("historyCache");
            this.cachedPages = [];
            this.setCache([currentPage]);

        }
    });
})(jQuery);