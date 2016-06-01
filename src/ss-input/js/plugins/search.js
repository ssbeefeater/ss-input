(function ($) {
    Ss_input.plugins['search'] = Ss_input.Plugin.extend({
        defaults: {
            deepSearch: {
                multiple:false,
                data: {},
                ajaxOptions: {}
            },
            searchFields: []
        },
        init: function () {
            if(this.options.deepSearch)
            this.options.deepSearch=$.extend({},this.defaults,this.options.deepSearch);
            this.searchKeywords = {};
            this.currentItems = '';
            this.setButtons()
             .setEvents();
        },
        resetUi: function () {
            this.searchKeywords = {};
            this.currentItems = '';
            this.setButtons(this.ssi.$content.find('#ssi-searchButton').parent().empty());
        },
        setButtons: function ($appendTo) {
            var thisS = this, ssi = this.ssi, button = [], time;
            if (this.options.deepSearch!=false) {
                button.push({
                    label: '<div class="icon ssi-searchMiniIcon"></div>',
                    className: 'ssi-inBtn ssi-inSearchBtn',
                    method: function () {
                        thisS.deepSearch(ssi.$content.find('#ssi-searchInput').val(), $(this).parent().find('input').hasClass('disabled'));
                    }
                })
            }
            var extraInput = [], length = this.options.searchFields.length;
            if (length > 1) {
                button.unshift({
                    label: '▼',
                    className: 'ssi-inBtn ssi-inSearchBtn ssi-moreInputs',
                    method: function () {
                        var $this = $(this);
                        var extraFields = $this.siblings('.ssi-extraWrapper');
                        var mainSearch = $this.prev('#ssi-searchInput');
                        mainSearch.trigger('input.ssi');
                        if (extraFields.hasClass('ssi-slide')) {
                            mainSearch.removeClass('disabled');
                            extraFields.removeClass('ssi-slide')
                        } else {
                            mainSearch.addClass('disabled').val('');
                            extraFields.addClass('ssi-slide')
                        }
                        extraFields.children()
                         .val('')
                         .trigger('change.ssi');

                    }
                })
            }
            for (var i = 0; i < length; i++) {
                this.searchKeywords[this.options.searchFields[i]] = '';
                extraInput.push(new Ss_input.Input({
                    className: 'ssi-searchInput ssi-menuInput ssi-extraInput',
                    placeholder: this.translate(this.options.searchFields[i]),
                    type: 'search'
                }));
                extraInput[i].data('field', this.options.searchFields[i]).on('input.ssi', function (e) {
                    clearTimeout(time);
                    var $this = $(this);
                    if (e.which == 13)$(this).next().next().trigger('click');
                    thisS.searchKeywords[$this.data('field')] = $this.val();
                    time = setTimeout(function () {
                        thisS.searchDir(Object.keys(thisS.searchKeywords).map(function (key) {
                            return thisS.searchKeywords[key];
                        }))
                    }, 300);
                })
            }
            ssi.addButton({
                 label: '<div class="icon ssi-searchIcon"></div>',
                 title: this.translate('search'),
                 id: 'ssi-searchButton',
                 keyCode: '',
                 input: {
                     containerClass: 'ssi-searchcont',
                     className: 'ssi-searchInput ssi-menuInput',
                     placeholder: this.translate('search'),
                     id: 'ssi-searchInput',
                     type: 'search',
                     buttons: button
                 },
                 className: 'ssi-searchSwitch'
             }, 'menuButton', $appendTo || ['menu'])
             .find('.ssi-btnContainer')
             .append($('<div class="ssi-extraWrapper">')
              .append(extraInput)
             );
            return this;
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this, time;
            ssi.$content.on('input.ssi', '#ssi-searchInput', function (e) {
                clearTimeout(time);
                if (e.which == 13)$(this).next().next().trigger('click');
                var $thisS = $(this);
                time = setTimeout(function () {
                    thisS.searchDir($thisS.val());
                }, 300);
            });
            ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                if (thisS.searchInProgress) {
                    thisS.currentItems = '';
                    thisS.searchInProgress = false;
                    ssi.$element.find('#ssi-searchButton').next().hide(500);
                    ssi.$element.find('#ssi-searchInput').val('');
                }
            }).on('echoItemsAction.ssi', function () {
                if (thisS.searchInProgress) {
                    thisS.searchDir(ssi.$content.find('#ssi-searchInput').val());
                }
            }).on('beforeEchoItemsAction.ssi', function (e, page) {
                if (!thisS.options.searchFields.length) {
                    for (var key in page.data[0]) {
                        thisS.options.searchFields.push(key);
                    }
                }
            }).on('changeSchemaAction.ssi', function (e, data) {
                thisS.options.searchFields = data['search'];
                if(thisS.options.deepSearch)
                thisS.options.deepSearch.ajaxOptions.url = data['url'].replace('/id');
                thisS.resetUi();
            });
            return this;
        },
        deepSearch: function (keyword, multiple) {
            if (multiple && this.options.deepSearch.multiple != false) {
                keyword = {};
                for (var key in this.searchKeywords) {
                    if (this.searchKeywords[key])
                        keyword[key] = this.searchKeywords[key];
                }
            }
            if (!keyword) return;
            var ssi = this.ssi,
             thisS = this,
             callback = function (data) {
                 thisS.currentItems = [];
                 ssi.$element.trigger('removeCollectionAction.ssi', 'search540123x');
                 var page = {
                     alias: thisS.translate('search'),
                     href: "#",
                     readOnly: true,
                     id: 'search540123x',
                     data: data
                 };
                 ssi.currentCollection = page;
                 ssi.$element.trigger('scanAction.ssi', page);
                 ssi.plugins['scan'].echoFiles(page, true);
             };
            this.prev = ssi.currentCollection.id;

            var data = $.extend({}, this.options.deepSearch.data, (typeof keyword==='object'? keyword:{'keyword': keyword}));
            var ajaxOptions = $.extend({}, {
                data: data,
                type:'GET'
            }, this.options.deepSearch.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, callback);
            return this;
        },
        getSearchCondition: function (keyword, separator) {
            separator = separator || '||';
            keyword = Ss_input.tools.toArray(keyword);
            var valueLength = keyword.length;
            var regEx = "new RegExp('.*" + keyword[0] + ".*','i')";

            var searchCondition = regEx + '.test(field:(' + this.options.searchFields[0] + '))';
            for (var i = 1, length = this.options.searchFields.length; i < length; i++) {
                if (valueLength > 1) {
                    regEx = "new RegExp('.*" + keyword[i] + ".*','i')";
                }
                searchCondition += separator + regEx + '.test(field:(' + this.options.searchFields[i] + '))';
            }
            return Ss_input.tools.fieldReplace(searchCondition);
        },
        searchDir: function (keyword) {

            var ssi = this.ssi, content = [], separator = '||';
            this.searchInProgress = !!keyword;
            if (!keyword) {
                if (!!this.currentItems.length) {
                    ssi.plugins['scan'].echoFiles({
                        id: ssi.currentCollection.id,
                        data: this.currentItems
                    });
                }
                this.currentItems = [];
                return this;
            }
            if (!this.currentItems.length) {
                this.currentItems = ssi.getPageData();
            }
            if (keyword instanceof Array)
                separator = '&&';
            else  keyword = keyword.toLowerCase();
            var condition = this.getSearchCondition(keyword, separator);
            for (var i = 0, data, length = this.currentItems.length; i < length; i++) {
                data = this.currentItems[i];
                if (eval(condition)) {
                    /*    //  if (data[this.options.searchFields].toLowerCase().indexOf(keyword.toLowerCase()) >= 0) {
                     var reg = new RegExp('(.*)(' + Ss_input.tools.escape(keyword) + ')(.*)', 'gi');
                     sName = data[this.options.searchFields].replace(reg, '$1<span class="ssi-highlight">$2</span>$3');*/

                    content.push(data)
                }
            }
            ssi.plugins['scan'].echoFiles({id: ssi.currentCollection.id, data: content}, '', true);
            return this;
        }
    })

})(jQuery);
