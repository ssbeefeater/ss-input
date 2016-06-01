(function ($, ssi_modal) {

    var ssi_buttons = {},
     index = 0;
    this.Ss_input = function (element, option) {
        var defaults = {
            plugins: [],
            modalOptions: {//http://ssbeefeater.github.io/#ssi-modal/documentation
                sizeClass: 'large',
                fixedHeight: true,
                fitScreen: true,
                buttons: []
            },
            permissions: ['all'],
            excludePlugin: [],
            language: 'en',
            mode: 'selection',
            storageType: 'fileSystem',
            showTo: 'modalWindow',
            responseValidation: false
        };
        this.ssi_excludeList = {};
        this.options = $.extend(true, defaults, option);
        this.requireAfter = ['scan'];
        this.uniqueId = index;
        this.readOnlyMode = false;
        this.plugins = [];
        this.pluginNames = [];
        this.handlersGroup = 'handlers';
        this.corePlugins = [];
        this.initializedButtons = {};
        this.readyState = false;
        this.language = Ss_input.locale[this.options.language];
        this.$element = $(element);
        index++;
        this.init();
    };
    Ss_input.prototype.buttonSelectors = {
        'menu': '#ssi-menuButtons',
        'contextMenu': '#ssi-contextMenuUl',
        'options': '#ssi-TasksBtn+ul',
        'actions': '#ssi-actionsBtn+ul',
        'items': '.ssi-optionsDiv',
        'bottom': '#ssi-rightButtons',
        'openWith': '#ssi-openWithBtn ul',
        'editWith': '#ssi-editWithBtn ul'
    };
    Ss_input.prototype.init = function () {
        var checkRequirements = Ss_input.tools.keyExists(this.options.storageType, Ss_input.storageTypes);
        checkRequirements = checkRequirements.concat(this.options.mode != 'manager' ? Ss_input.tools.keyExists(this.options.mode, Ss_input.modePlugins) : [], Ss_input.tools.keyExists(this.require, Ss_input.plugins));
        if (checkRequirements.length != 0) {
            console.log('Some requirements are missing: ' + checkRequirements.toString());
            return;
        }
        var thisS = this;
        if (this.options.plugins.length > 0) {
            this.pluginNames = this.options.plugins;
            var missing = Ss_input.tools.arrayValuesInArray(this.require, this.pluginNames);
            if (missing) {
                this.pluginNames = this.pluginNames.concat(missing);
            }
        } else {
            for (var pluginName in Ss_input.plugins) {
                this.pluginNames.push(pluginName);
            }
        }
        this.pluginInit(this.options.storageType, Ss_input.storageTypes);
        this[this.options.storageType] = this.corePlugins[this.options.storageType];
        if (this.options.mode != 'manager') {
            this.pluginInit(this.options.mode, Ss_input.modePlugins);
            this[this.options.mode] = this.corePlugins[this.options.mode];
        } else {
            if (this.options.showTo != 'modalWindow')
                this.options.showTo = this.$element;
            this.$element.addClass('ss-input');

        }
        if (this.options.showTo === 'modalWindow') {
            this.setModal();
        } else {
            var $showTo = $(this.options.showTo);
            if (!$showTo.is('div')) {
                console.log('Use a div.');
                return;
            }
            thisS.$element.trigger('earlyShowAction');
            var content = thisS.setContent();
            if (!content) {
                return;
            }
            $showTo.first().addClass('ssi-mainModal').html(content);
            thisS.setHeight();
        }
    };
    Ss_input.prototype.setModal = function () {
        var thisS = this;
        $.extend(this.options.modalOptions, {
            className: "ssi-mainModal",
            onClose: function () {
                thisS.$element.trigger('resetAction.ssi').trigger('closeAction.ssi');
            }
        });
        this.$element.on('click', function (e) {
            e.preventDefault();
            thisS.$element.trigger('earlyShowAction');
            var $eTarget = $(e.target);
            if ($eTarget.hasClass('ss-input')) {
                var modal = thisS.createWindow(thisS.options.modalOptions);
                var content = thisS.setContent();
                if (!content) {
                    modal.close();
                    return;
                }
                modal.setContent(content);
                thisS.setHeight();
            }
        });
    };
    Ss_input.prototype.setAfterEvents = function () {
        var optionsDiv, thisS = this;
        $(window).bind('beforeunload', function () {
            thisS.$element.trigger('resetAction.ssi').trigger('closeAction.ssi').off('.ssi');
        });

        this.$content.on({
            'mouseenter.ssi': function (e) {
                e.preventDefault();
                optionsDiv = $(this).find('.ssi-optionsDiv');
                optionsDiv.fadeIn(200);//slideDown(100);
            },
            'mouseleave.ssi': function () {
                if (optionsDiv.hasClass('selected') === false) {
                    optionsDiv.fadeOut(200);//.slideUp(100);
                }
            }
        }, '.ssi-displayDiv');
        this.$element.on('closeAction.ssi', function () {
            ssi_modal.removeAll();
            thisS.currentCollection = {};
            thisS.initializedButtons = [];
            thisS.readOnlyMode = '';
            $(this).off('.ssi');
            $('body').off('.ssi');
        });
        this.$content.on('click', function (e) {
            if (!$(e.target).is('input'))$(this).focus();
        });

    };
    Ss_input.prototype.setContent = function () {
        var checkPlugin = Ss_input.tools.keyExists(this.requireAfter, Ss_input.plugins);
        var requirePending = Ss_input.tools.arrayValuesInArray(this.requireAfter, this.pluginNames);
        this.pluginNames = this.pluginNames.concat(requirePending);
        if (checkPlugin.length != 0) {
            console.log('Some requirements are missing: ' + checkPlugin.toString());
            return false;
        }
        this.$content = $(Ss_input.templates.mainContent);
        if (this.options.showTo !== 'modalWindow') {
            this.$content.append(Ss_input.templates.bottomButtons)
        }
        if ($.isEmptyObject(this.plugins)) {
            this.pluginInit(this.pluginNames);
        } else {
            this.resetPlugins(this.plugins);
        }
        this.$element.trigger('showAction');
        this.buttonsInit();
        this.setAfterEvents();
        return this.$content;
    };
    Ss_input.prototype.destroy = function () {
        this.$element.trigger('closeAction.ssi');
        this.$content.remove();
    };
    Ss_input.prototype.checkPermissions = function (permissions, name) {
        return ((permissions === 'read' || this.options.permissions[0] === 'all' || Ss_input.tools.arrayValuesInArray(permissions, this.options.permissions).length === 0 || $.inArray(name, this.options.permissions) !== -1) && ($.inArray(name, this.options.excludePlugin) === -1 || $.inArray(name, this.require) !== -1 || $.inArray(name, this.requireAfter) !== -1));
    };
    Ss_input.prototype.handlerInit = function (handler, plugin, handlersGroup) {
        new Ss_input[handlersGroup][handler](this, plugin, handler);
    };
    Ss_input.prototype.pluginInit = function (plugins, pluginGroup) {
        plugins = Ss_input.tools.toArray(plugins);
        for (var i = 0, length = plugins.length; i < length; i++) {
            try {
                pluginGroup = pluginGroup || Ss_input.plugins;
                if (Ss_input.tools.keyExists(plugins[i], pluginGroup).length != 0) {
                    throw('did not load');
                }
                if (!plugins[i]) {
                    continue;
                }
                var plugin = new pluginGroup[plugins[i]](this, this.options[plugins[i]]);
                if (!this.checkPermissions(plugin.permissions, plugins[i]) || $.isEmptyObject(plugin) || Ss_input.tools.keyExists(plugins[i], this[plugin.type]).length === 0) {
                    continue;
                }
                var unloadedPlugins = Ss_input.tools.keyExists(plugin.require, pluginGroup);
                if (unloadedPlugins.length === 0) {
                    var notInitialized = Ss_input.tools.keyExists(plugin.require, this[plugin.type]);
                    this.pluginInit(notInitialized);
                    if (Ss_input.tools.keyExists(notInitialized, this.plugins).length === 0 || Ss_input.tools.keyExists(notInitialized, this.corePlugins).length === 0) {
                        this[plugin.type][plugins[i]] = plugin;
                        if (Ss_input[this.handlersGroup].hasOwnProperty(plugins[i])) {
                            this.handlerInit(plugins[i], plugin, this.handlersGroup);
                        } else if (Ss_input.handlers.hasOwnProperty(plugins[i])) {
                            this.handlerInit(plugins[i], plugin, 'handlers');
                        }
                        plugin.init();
                    } else {
                        throw('requires ' + notInitialized.toString() + '.');
                    }
                } else {
                    throw('requires ' + unloadedPlugins.toString() + '.');
                }
            } catch (error) {
                console.log(plugins[i] + ' ' + error);
            }

        }
    };
    Ss_input.prototype.resetPlugins = function (pluginGroup) {
        for (var pluginName in pluginGroup) {
            var plugin = pluginGroup[pluginName];
            if (Ss_input[this.handlersGroup].hasOwnProperty(pluginName)) {
                this.handlerInit(pluginName, plugin, this.handlersGroup);
            } else if (Ss_input.handlers.hasOwnProperty(pluginName)) {
                this.handlerInit(pluginName, plugin, 'handlers');
            }
            plugin.init();
        }
    };
    Ss_input.prototype.coreButtonsInit = function (type) {
        switch (Ss_input.tools.findKey(type, this.buttonSelectors)) {
            case 'contextMenu':
                break;
            case 'actions':
                this.$content.find(this.buttonSelectors['menu']).append(this.addButton({
                    id: 'ssi-actionsBtn',
                    title: this.language.actions,
                    label: '<div class="icon ssi-actionsIcon"></div>',
                    dropDown: true,
                    selectionRequired: true
                }, 'menuButton', false));
                break;
            case 'options':
                this.$content.find(this.buttonSelectors['menu']).append(this.addButton({
                    id: 'ssi-TasksBtn',
                    title: this.language.options,
                    label: '<div class="icon ssi-optionsIcon"></div>',
                    dropDown: true
                }, 'menuButton', false));
                break;
            case 'openWith':
                this.$content.find(this.buttonSelectors['contextMenu']).append(this.addButton({
                    id: 'ssi-openWithBtn',
                    title: 'openWith', //this.language.openWith,
                    label: '<span class="icon ssi-openWithIcon"></span>openWith',
                    selectionRequired: true,
                    subMenu: true
                }, 'listButton', false));
                break;
            case 'editWith':
                this.$content.find(this.buttonSelectors['contextMenu']).append(this.addButton({
                    id: 'ssi-editWithBtn',
                    title: 'editWith', //this.language.openWith,
                    label: '<span class="icon ssi-editWithIcon"></span>editWith',
                    subMenu: true,
                    selectionRequired: true
                }, 'listButton', false));
                break;
        }
    };
    Ss_input.prototype.buttonsInit = function () {

        var selectorList = this.buttonSelectors;
        this.$content.find(selectorList['menu']).append(ssi_buttons[selectorList['menu']]);
        delete  ssi_buttons[selectorList['menu']];
        for (var selector in ssi_buttons) {
            try {
                var selectors = selector.split(','), toInitialize;
                if ((toInitialize = Ss_input.tools.keyExists(selectors, this.initializedButtons)).length != 0) {
                    for (var i = 0, length = toInitialize.length; i < length; i++) {
                        this.initializedButtons[toInitialize[i]] = true;
                        this.coreButtonsInit(toInitialize[i]);
                    }
                }
                this.$content.find(selector).append(ssi_buttons[selector]);
            } catch (err) {
//removeIf(production)
                console.log(err);
//endRemoveIf(production)
            }
        }
        ssi_buttons = {};
    };
    Ss_input.prototype.addButton = function (buttonOptions, type, appendTo, excludeItem) {
        buttonOptions = Ss_input.tools.toArray(buttonOptions);
        type = type || 'menuButton';
        var buttons = [];
        for (var y = 0, optionsLength = buttonOptions.length; y < optionsLength; y++) {
            if (appendTo == 'bottom' && this.options.showTo === 'modalWindow') {
                this.options.modalOptions.buttons.push(buttonOptions[y]);
                continue;
            }
            var $btn = new Ss_input.Button(buttonOptions[y], type, this.$content);
            if (appendTo) {
                if (appendTo instanceof $) {
                    appendTo.append($btn);
                } else {
                    if (appendTo != 'itemButton') {
                        var ButtonWrapper = [];
                        for (var i = 0, length = appendTo.length; i < length; i++) {
                            ButtonWrapper.push(this.buttonSelectors[appendTo[i]]);
                        }
                        if (ssi_buttons.hasOwnProperty(ButtonWrapper.toString())) {
                            ssi_buttons[ButtonWrapper.toString()].push($btn);
                        } else {
                            ssi_buttons[ButtonWrapper.toString()] = [$btn];
                        }
                        if (excludeItem && buttonOptions[y].selectionRequired) {
                            this.ssi_excludeList[buttonOptions[y].className] = excludeItem;
                        }
                    }
                }
            }
            buttons.push($btn);
        }
        return buttons.length == 1 ? buttons[0] : buttons;
    };
    Ss_input.prototype.notify = function (type, msg) {
        ssi_modal.notify(type, {overrideOther: true, content: msg})
    };
    Ss_input.prototype.checkExcludedButtons = function (onHide) {
        var excludeList = this.ssi_excludeList,
         selected = this.get$selectedItems();
        var $mustSelect = this.$content.find('.ssi-mustSelect').removeClass('ssi-hidden disabled');
        for (var className in excludeList) {
            selected.each(function () {
                var info = $(this).data('info');
                if (eval(Ss_input.tools.dataReplace(excludeList[className], 'info')) == 'false') {
                    var hiddenFields = $mustSelect.filter('.' + className).addClass('ssi-hidden');
                    if (typeof onHide === 'function')
                        onHide(hiddenFields);
                    return false;
                }
            })
        }
    };
    Ss_input.prototype.createWindow = function (options, trigger) {
        return ssi_modal.show(options, trigger);
    };
    Ss_input.prototype.get$mainElementById = function (id, $content) {
        $content = $content || this.$content;
        return $content.find(".ssi-mainElement[data-ID='" + id + "']");
    };
    Ss_input.prototype.get$mainElement = function ($e) {
        return ($e.hasClass('ssi-mainElement') ? $e : $e.parents('.ssi-itemWrapper').find('.ssi-mainElement'));
    };
    Ss_input.prototype.getId = function ($e) {
        if ($e) {
            if (typeof $e === 'string')
                return this.get$mainElementById($e).attr('data-ID');
            return this.get$mainElement($e).attr('data-ID');
        }
        var idArray = [];
        this.get$selectedItems().each(function () {
            idArray.push($(this).attr('data-ID'));
        });
        return idArray;
    };
    Ss_input.prototype.get$itemWrapper = function ($e) {
        return $e.parents('.ssi-itemWrapper');
    };
    Ss_input.prototype.get$selectedItems = function ($e) {
        try {
            var select = this.plugins['select'];
            if ($e) {
                return this.get$mainElement($e)
            }
            if (select.selectionList.length > 0) {
                return $('.ssi-mActive');
            }
            return this.plugins['contextMenu'].rightClickItem || $();

        } catch (err) {
            //removeIf(production)
            console.log(err.message);
            //endRemoveIf(production)
            return $();
        }
    };
    Ss_input.prototype.getSelectedData = function ($e) {
        try {
            var $items = this.get$selectedItems($e);
            var data = [];
            $items.each(function () {
                data.push($(this).data('info'))
            });
            return data;
        } catch (err) {
            //removeIf(production)
            console.log(err.message);
            //endRemoveIf(production)
            return [];
        }
    };
    Ss_input.prototype.getSelectedField = function (fieldName, $e) {
        var selectedData = this.getSelectedData($e), fieldList = [];
        for (var i = 0, length = selectedData.length; i < length; i++) {
            try {
                fieldList.push(selectedData[i][fieldName]);
            } catch (err) {
                //removeIf(production)
                console.log(err.message);
                //endRemoveIf(production)
            }
        }
        return fieldList
    };
    Ss_input.prototype.getPageData = function (path) {
        var cache = this.plugins['cache'], itemList = [];
        if (cache) {
            itemList = cache.getCachedPage(path).data;
        } else {
            if (path && path != this.currentCollection.id)return [];
            this.$content.find('.ssi-selectable').each(function () {
                itemList.push($(this).data('info'))
            });
        }
        return itemList;
    };
    Ss_input.prototype.getItemData = function (key, value, path) {
        return Ss_input.tools.findByKey(this.getPageData(path), key, value);
    };
    Ss_input.prototype.getUrlList = function () {
        try {
            var select = this.plugins['select'];
            if (select.selectionList.length > 0) {
                return select.selectionList;
            } else {
                return [this.plugins['contextMenu'].rightClickItem.attr('data-ID')];
            }
        } catch (err) {
            //removeIf(production)
            console.log(err.message);
            //endRemoveIf(production)
            return [];
        }
    };
    Ss_input.prototype.ajaxCall = function (options, callback, catchError) {
        options = options || {};
        var $progressBar = this.$content.find('#ssi-progressBar');
        var xhr = function () {
            var xhr = new window.XMLHttpRequest();
            xhr.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    var percentComplete = e.loaded / e.total;
                    $progressBar
                     .css({
                         width: percentComplete * 100 + '%'
                     });
                } else {
                    $progressBar.css('width', '100%');
                }
            }, false);

            return xhr;
        };
        var thisS = this;
        var defaults = {
            xhr: xhr,
            type: 'POST',
            beforeSend: function () {
                thisS.$content.find('#ssi-loader').removeClass('ssi-hidden');
                $progressBar.removeClass('ssi-hidden');
            }

        };
        options = $.extend({}, defaults, options);
        if (options.stringifyData) {
            options.data = JSON.stringify(options.data)
        }
        $progressBar.removeClass('hide');
        this.$element.trigger('sendRequestAction.ssi');
        $.ajax(options).done(function (data, textStatus, jqXHR) {
            thisS.$element.trigger('responseAction.ssi');
            if (!callback)return;
            var response;
            try {
                response = $.parseJSON(data);
            } catch (err) {
                response = data;
            }
            data = response;
            <!--removeIf(production)-->
            /*
             <!--endRemoveIf(production)-->

             try {
             <!--removeIf(production)-->
             */
            <!--endRemoveIf(production)-->
            if (thisS.options.responseValidation) {
                var valData = thisS.options.responseValidation;
                if (typeof valData.validationKey === 'object' && valData.resultKey == 'validationKey') {
                    if (data.hasOwnProperty(valData.validationKey.success)) {
                        callback(data[valData.validationKey.success], textStatus, jqXHR);
                    } else {
                        throw {
                            type: 'error',
                            msg: data[valData.validationKey.error]
                        }
                    }
                } else {
                    if (data[valData.validationKey] == valData.success) {
                        callback(data[valData.resultKey], textStatus, jqXHR);
                    } else {
                        throw {
                            type: 'error',
                            msg: data[valData.resultKey]
                        }
                    }
                }
            } else {
                callback(data, textStatus, jqXHR);
            }
            <!--removeIf(production)-->
            /*
             <!--endRemoveIf(production)-->
             } catch (err) {
             if(!catchError){
             if (err.type === 'error') {
             thisS.notify('error', err.msg);
             } else {
             console.log(err.msg);
             console.log(data);
             console.log(err.message);
             }
             }else{catchError(err)}
             }
             <!--removeIf(production)-->
             */
            <!--endRemoveIf(production)-->

        }).fail(function (request, error) {
            if (catchError)
                catchError();
            console.log(arguments);
            console.log(" Ajax error: " + error);
        }).complete(function () {
            thisS.reloadProgressbar();
        })
    };
    Ss_input.prototype.setHeight = function (offset) {
        offset = offset || (this.$content.hasClass('ssi-multiPickMode') && this.options.showTo != 'modalWindow' ? 115 : 70);
        var height = parseInt(this.$content.parent().height()) - offset;
        this.$content.find('#ssi-mainContent').css('height', height);
    };
    Ss_input.prototype.openCollection = function (id, url, data) {
        this.$element.trigger('changeCollectionAction.ssi');
        this.plugins['scan'].scanCollection(id, url, data);
    };
    Ss_input.prototype.reloadProgressbar = function () {
        this.$content.find('#ssi-loading').html('');
        var thisS = this;
        setTimeout(function () {
            thisS.$content.find('#ssi-loader').addClass('ssi-hidden');
            thisS.$content.find('#ssi-progressBar')
             .addClass('ssi-hidden')
             .css('width', 0 + '%');
        }, 500);
    };
    $.fn.ss_input = function (opts) {
        return this.each(function () {
            new Ss_input(this, opts)
        });
    };
    return Ss_input;
})(jQuery, ssi_modal);