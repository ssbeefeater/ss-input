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
            return [];
        }
    };
    Ss_input.prototype.getSelectedField = function (fieldName, $e) {
        var selectedData = this.getSelectedData($e), fieldList = [];
        for (var i = 0, length = selectedData.length; i < length; i++) {
            try {
                fieldList.push(selectedData[i][fieldName]);
            } catch (err) {
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
var Button = function (options, type, $element, input) {
    var defaults = {
        label: '',
        title: '',
        dropDown: false,
        id: '',
        attributes: '',
        selectionRequired: false,
        stopPropagation: true,
        keyPress: '',
        subMenu: false,
        method: function () {
        },
        className: '',
        $element: $element,
        $input: input
    };
    this.options = $.extend({}, defaults, options);
    var thisS = this,
     $template = Ss_input.tools.template(Ss_input.templates.buttons[type], this.options);
    this.$element = $($template).click(function (e) {
        e.preventDefault();
        if (thisS.options.stopPropagation)
            e.stopPropagation();
        if (!$(this).hasClass('disabled')) {
            if (typeof thisS.options.method === 'function') {
                var args = [e];
                if (thisS.options.$input)
                    args.push(Ss_input.tools.sanitizeInput(input.val()));
                thisS.options.method.apply(this, args);
            }
        }
    });
    if (this.options.attributes) {
        this.$element.attr(this.options.attributes);
    }
    if (this.options.keyPress) {
        this.setKeyEvents();
    }
    if (this.options.input) {
        this.getInput();
    } else if (this.options.dropDown) {
        this.setDropDown();
    } else if (this.options.subMenu) {
        this.setSubMenu();
    }
    return this.$element;
};
Ss_input.Button = Button;
Button.prototype = {
    setSubMenu: function () {
        var subUlContent = [];
        for (var y = 0, length2 = this.options.subMenu.length; y < length2; y++) {
            subUlContent.push(new Button(this.options.subMenu[y], 'listButton', this.options.$element));
        }
        this.$element.addClass('parent').append($('<ul>').html(subUlContent));
    },
    setDropDown: function () {
        var $dropDown = $('<div class="ssi-dropDownWrapper">');
        var ulContent = [];
        for (var i = 0, length = this.options.dropDown.length; i < length; i++) {
            ulContent.push(new Button(this.options.dropDown[i], 'listButton', this.options.$element));
        }
        this.$element = $dropDown.append(this.$element.addClass('ssi-dropDown'), $('<ul class="ssi-dropdown">').html(ulContent));
    },
    setKeyEvents: function () {
        var thisS = this;
        var condition = "e.which == thisS.options.keyPress.keyCode &&!$(e.target).is('input')";
        if (this.options.keyPress.ctrl)
            condition += "&&e.ctrlKey";
        if (this.options.keyPress.shift)
            condition += "&&e.shiftKey";
        $((this.options.$element || 'body')).on('keydown.ssi', function (e) {
            if (!thisS.$element.hasClass('disabled') && eval(condition) == true) {
                e.stopPropagation();
                e.preventDefault();
                thisS.$element.eq(0).trigger('click');
            }
        })
    },
    getInput: function () {
        var $input =new Ss_input.Input(this.options.input), thisS = this,
         $div = $('<div class="ssi-btnContainer ' + this.options.input.containerClass + '">').append($input),
         $wrapper = $('<div>').append(this.$element, $div);
        if (this.options.input.enterKey)
            $input.keyup(function (e) {
                if (e.keyCode == 13) {
                    $(this).next().trigger('click');
                }
            });
        this.$element.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $eTarget = $(this).addClass('disabled');
            $('.ssi-btnContainer').not('.' + thisS.options.input.containerClass).hide(500);
            $div.toggle(500, function () {
                $eTarget.removeClass('disabled');
                $input.focus();
            });
        });
        if(this.options.input.buttons)
        for (var i = 0, length = this.options.input.buttons.length; i < length; i++) {
            $div.append(new Button(this.options.input.buttons[i], 'menuButton', this.options.$element, $input));
        }
        return this.$element = $wrapper;

    }
};

(function ($) {

    Ss_input.handlers = [];
    var Handler = function (ss_input,pluginInstance,pluginName) {
        this.ssi = ss_input;
        this.plugin=pluginInstance;
        this.pluginName=pluginName;
        this.storage=ss_input.corePlugins[ss_input.options.storageType];
        this.init();
        this.setDefaults(this.defaults);
        this.extendPlugin(this.extend);
    };
    Ss_input.Handler = Handler;
    Handler.prototype = {
        locale: {},
        group:'fileSystem',
        template:{},
        extend:{},
        defaults:{},
        require:[],//Plugins that are required. If something from this list did not load the plugin wont load too.
        init: function () {
        },
        extendPlugin:function(proto){
            $.extend(Object.getPrototypeOf(this.plugin) ,proto);
        },
        setDefaults: function (defaults) {
            $.extend(this.plugin.options,defaults,(this.ssi.options[this.pluginName]||{}));
        },
        unload:function(name){
            this.ssi.pluginNames[ this.ssi.pluginNames.indexOf(name)]=null;
            Ss_input.tools.removeByKey(this.ssi[this.type],name);
        }
    };
    Handler.extend = function (prototype,handlerName) {
        var handler = (handlerName? Ss_input.handlers[handlerName]:this),
         child;
        if(!handler){
            console.log('The handler '+handlerName+' hasn\'t initialize!');
            return;
        }
        if (prototype.hasOwnProperty('constructor')) {
            child = prototype.constructor;
        }else {
            child = function () {
                return handler.apply(this, arguments);
            };
        }
        $.extend(child.prototype, handler.prototype, prototype);
        return child;
    };


})(jQuery);
var Input = function (options, defaultValue) {
    var defaults = {
        checked: true,
        className: "",
        id: "",
        name: "",
        type: "text",
        value: ""
    };
    this.options = $.extend({}, defaults, options);
    this.defaultValue = defaultValue||this.options.value;
    if (this[this.options.type]) {
        this[this.options.type]();
    } else {
        this.setInput();
    }
    return $(this.$element);
};
Ss_input.Input = Input;
Input.prototype = {
    select: function () {
        this.options.select = this.options.select || [];
        this.options.multiple = this.options.multiple || "";
        var optionDefaults = {
            value: "",
            label: "",
            selected: false
        }, selectItems = "";
        this.options.multiple = (this.options.multiple ? "multiple" : "");
        for (var i = 0, length = this.options.options.length; i < length; i++) {
            var itemOption = $.extend({}, optionDefaults, this.options.options[i]);
            if (typeof this.defaultValue !== "undefined") {
                this.defaultValue = Ss_input.tools.toArray(this.defaultValue);
                itemOption.selected = $.inArray(itemOption.value, this.defaultValue) !== -1;
            }
            itemOption.selected = (itemOption.selected ? 'selected' : '');
            selectItems += Ss_input.tools.template(Ss_input.templates.input.selectItem, {options: itemOption});
        }
        this.$element = Ss_input.tools.template(Ss_input.templates.input.select, {
            options: this.options,
            selectItems: selectItems
        });
    },
    radio: function () {
        var radioGroupItems = '';
        var radioDefaults = {
            value: "",
            label:'',
            name: this.options.name,
            checked: false,
            type:"radio"
        };
        for (var i = 0; i < this.options.radio.length; i++) {
            var radio = this.options.radio[i],
             radioOptions = $.extend({}, radioDefaults, radio);
            radioOptions.checked = (typeof this.defaultValue!=='undefined' ? (radioOptions.value == this.defaultValue) : radioOptions.checked);
            radioGroupItems += Ss_input.tools.template(Ss_input.templates.input.radio, {options: radioOptions});
        }
        this.$element = Ss_input.tools.template(Ss_input.templates.input.radioGroup, {
            options: this.options,
            radioGroupItems: radioGroupItems
        });
    },
    checkbox: function () {
        this.options.checked = (typeof this.defaultValue!=='undefined' ? this.defaultValue : this.options.checked);
        this.$element = Ss_input.tools.template(Ss_input.templates.input['radio'], {options: this.options});
    },
    setInput: function () {
        this.options.value = this.defaultValue;
        var inputTemplates=Ss_input.templates.input;
        var template=inputTemplates[this.options.type]||inputTemplates['text'];
        this.$element = Ss_input.tools.template(template, {options: this.options});
    }
};

Ss_input.locale = {
    en: {
        extError: '$1 files are not supported',//$1=file extension ie(exe files are not supported)
        existError: 'This file already exists!',
        existInListError: 'This file is already in the list.',
        uploadImg: 'Upload image',
        replaceMsg: '"File with name $1 already exists in this folder.Do you want to replace it?',//$1=file name ie(File with name example.jpg already exists...)
        continue: 'Continue',
        replace: 'Replace',
        uploadSuccess: 'The file uploaded successfully!',
        pickSuccess: 'The remote file was selected successfully!',
        successCreated: "The folder created successfully!",
        fileSuccessCreated: "The file created successfully!",
        mkdirSuccess: 'The folder created successfully!',
        icons: 'Icons',
        insert: 'Insert',
        home: 'Home',
        options: 'Options',
        defaultValues: 'Default values',
        date: 'Date',
        size: 'Size',
        type: 'Type',
        dimensions: 'Dimensions',
        name: 'Name',
        ok: 'Ok',
        cleanCache: 'Clean cache',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        createCopy: 'Create copy',
        skip: 'Skip',
        delete: 'Delete',
        deleteMsg: 'Are you sure that you want to permanently delete the selected files?',
        delSuccess: 'The file deleted successfully!',
        cancel: 'Cancel',
        loadTime: 'Load time',
        location: 'Location',
        info: 'Info',
        details: 'Details',
        preview: 'Preview',
        small: 'Small',
        medium: 'Medium',
        large: 'large',
        iconSize: 'Icon size',
        createFolder: 'Create folder',
        newFile: 'New file',
        folderExistError: 'The folder with name $1 already exists!',
        previewType: 'Preview',
        refresh: 'Refresh',
        rename: 'Rename',
        search: 'Search',
        newDocument: 'New document',
        editDocument: 'Edit document',
        saveAsNew: 'Save as new',
        saveAndNew: 'Save and new',
        save: 'Save',
        select: 'Select',
        folders: 'Folders',
        files: 'Files',
        all: 'All',
        sort: 'Sort by',
        uploadFiles: 'Upload files',
        url: 'Url',
        addSuccess: 'The file added to your list!',
        invalidUrlError: 'The url you entered is not valid!',
        upload: 'Upload',
        limitError: 'You have reached the limit of $1 files.',
        selectedTooltip: 'Selected files',
        selectedBtn: 'Clear selected files',
        checkedTooltip: 'Checked files',
        checkedBtn: 'Clear checked files',
        addUrl: 'Add a url',
        noItems: 'Nothing in the list...',
        images: 'Images',
        textFiles: 'Text files',
        path: 'Path',
        ext: 'Extension',
        mimeType: 'Media type'
    },
    gr: {
        extError: 'Τα $1 αρχεία δεν υποστηρίζονται',
        existError: 'Αυτό το αρχείο υπάρχει ήδη!',
        existInListError: 'Αυτό το αρχείο υπάρχει ήδη στη λίστα!',
        uploadImg: 'Μεταφόρτωση εικόνας',
        upload: 'Μεταφόρτωση',
        replaceMsg: 'Tο αρχείο με όνομα $1 υπάρχει ήδη σε αυτόν τον προορισμό. Θέλετε να το αντικαταστήσετε;',
        continue: 'Συνέχεια',
        successCreated: "Ο φάκελος δημιουργήθηκε με επιτυχία!",
        fileSuccessCreated: "Το αρχείο δημιουργήθηκε με επιτυχία!",
        replace: 'Αντικατάσταση',
        uploadSuccess: 'ο αρχείο φορτώθηκε επιτυχώς!',
        pickSuccess: 'Το απομακρυσμένο αρχείο επιλέχθηκε με επιτυχία!',
        mkdirSuccess: 'Ο φάκελος δημιουργήθηκε με επιτυχία!',
        icons: 'Εικονίδια',
        insert: 'Προσθήκη',
        home: 'Αρχική',
        options: 'Επιλογές',
        defaultValues: 'Προεπιλεγμένα',
        date: 'Ημ/νια',
        size: 'Μέγεθος',
        type: 'Τύπος',
        name: 'Όνομα',
        path: 'Διαδρομή',
        dimensions: 'Διαστάσεις',
        ok: 'Ok',
        cleanCache: 'Εκκαθάριση cache',
        cut: 'Αποκοπή',
        copy: 'Αντιγραφή',
        paste: 'Επικόλληση',
        preview: 'Προεπισκόπηση',
        images: 'Εικόνες',
        textFiles: 'Αρχεία κειμένου',
        createCopy: 'Δημιουργία αντιγράφου',
        skip: 'Παράβλεψη',
        deleteMsg: 'Είστε σίγουρος ότι θέλετε να διαγράψετε οριστικά τα επιλεγμένα αρχεία;',
        delete: 'Διαγραφή',
        delSuccess: 'Το αρχείο διαγράφηκε με επιτυχία!',
        cancel: 'Ακύρωση',
        loadTime: 'Χρόνος φόρτωσης',
        location: 'Τοποθεσία',
        previewType: 'Προβολή',
        info: 'Πληροφορίες',
        details: 'Λεπτομέρειες',
        ext: 'Επέκταση',
        small: 'Μικρό',
        medium: 'Μεσαίο',
        large: 'Μεγάλο',
        iconSize: 'Μέγεθος εικονιδίων',
        createFolder: 'Δημιουργία φακέλου',
        newFile: 'Νέο αρχείο',
        folderExistError: 'Ο φάκελος με όνομα $1 υπάρχει ήδη',
        refresh: 'Ανανέωση',
        rename: 'Μετονομασία',
        search: 'Αναζήτηση',
        select: 'Επιλογή',
        folders: 'Φακέλων',
        files: 'Αρχείων',
        all: 'Όλων',
        newDocument: 'Νέα κατοχύρωση',
        editDocument: 'Διαμόρφωση',
        saveAsNew: 'Αποθήκευση ως καινούριο',
        saveAndNew: 'Αποθήκευση και καινούριο',
        save: 'Αποθήκευση',
        sort: 'Ταξινόμηση',
        url: 'Διεύθυνση url',
        addSuccess: 'Το αρχείο προστέθηκε στη λίστα !',
        invalidUrlError: 'Η διεύθυνση URL που εισάγατε δεν είναι έγκυρη!',
        uploadFiles: 'Μεταφόρτωση αρχείων',
        limitError: 'Έχεις φταση στο όριο των $1 αρχείων.',
        selectedTooltip: 'Επιλεγμένα αρχεία',
        selectedBtn: 'Εκκαθάριση επιλεγμένων αρχείων',
        checkedTooltip: 'Στιγματισμένα αρχεία',
        checkedBtn: 'Εκκαθάριση στιγματισμένα αρχείων',
        addUrl: 'Προσθήκη συνδέσμου',
        noItems: 'Δεν υπαρχει κάτι...',
        mimeType: 'Τύπος'
    }
};
(function ($) {

    Ss_input.plugins = [];
    Ss_input.storageTypes = [];
    Ss_input.modePlugins = [];
    var Plugin = function (ss_input, options) {
        for (var i = 0, length = this.externalResources.length; i < length; i++) {
            try {
                var obj = this.externalResources[i];
                eval(obj)
            } catch (err) {
                console.log('A required external resource not found:' + obj);
                return {};
            }
        }
        this.ssi = ss_input;
        this.options = $.extend({}, this.defaults, options);
    };
    Ss_input.Plugin = Plugin;
    Plugin.prototype = {
        permissions: 'read',
        locale: {},
        defaults: {},
        template: {},
        externalResources: [],
        type: 'plugins',//or corePlugins
        defaultLanguage: 'en',
        require: [],//Plugins that are required. If something from this list did not load the plugin wont load too.
        translate: function (word, fieldTranslation) {
            var translation;
            if (fieldTranslation == false)
                return word;
            try {
                translation = this.locale[this.ssi.options.language][word];
                if (!translation) {
                    throw 'error';
                }
                return translation;
            } catch (e) {
                try {
                    translation = Ss_input.locale[this.ssi.options.language][word];
                    if (!translation) {
                        throw 'error';
                    }
                    return translation;
                } catch (e) {
                    try {
                        translation = Ss_input.locale[this.defaultLanguage][word];
                        if (!translation) {
                            throw 'error';
                        }
                        return translation;
                    } catch (e) {
                        return word
                    }
                }
            }
        },
        init: function () {
        },
        unload: function (name) {
            this.ssi.pluginNames[this.ssi.pluginNames.indexOf(name)] = null;
            Ss_input.tools.removeByKey(this.ssi[this.type], name);
        }
    };
    Plugin.extend = function (prototype, pluginName, pluginGroup) {
        pluginGroup = pluginGroup || Ss_input.plugins;
        var plugin = (pluginName ? pluginGroup[pluginName] : this),
         child;
        if (!plugin) {
            console.log('The plugin ' + pluginName + ' hasn\'t initialize!');
            return function () {
            };
        }
        if (prototype.hasOwnProperty('constructor')) {
            child = prototype.constructor;
        } else {
            child = function () {
                return plugin.apply(this, arguments);
            };
        }
        $.extend(true, child.prototype, plugin.prototype, prototype);
        return child;
    };

})(jQuery);
(function ($) {
    Ss_input.templates = {
        buttons: {
            'menuButton': '<# if(selectionRequired) className+=" ssi-selectionRequired ssi-hidden";  #><button id="<#= id #>" data-title="<#= title #>" class="ssi-tooltip <#= className #> ssi-mBtn"> <#= label #> </button>',
            'listButton': '<# var LiClassName; if(selectionRequired){className+=" ssi-mustSelect disabled";} #><li id="<#= id #>" class="<#= className #> "><a href="#" > <#= label #> </a></li>',
            'itemButton': '<a href="#" id="<#= id #>" class="<#= className #> ssi-optionBtn"><#= label #></a>'
        },
        input: {
            select:'<select <#= options.multiple#> id = "<#=options.id#>" name ="<#=options.name#>" class="<#=options.className#>" ><#= selectItems#></select >',
            selectItem:'<option <#=options.selected#> value="<#=options.value#>"><#=options.label#></option>',
            textarea:'<textarea  id = "<#=options.id#>"  name = "<#=options.name#>" class= "<#=options.className#>"  <#=options.readOnly#> ><#=options.value#></textarea>',
            text:'<input type = "<#=options.type#>" placeholder="<#= options.placeholder#>" id = "<#=options.id#>"  name = "<#=options.name#>" class= "<#=options.className#>" value = "<#=options.value#>"/ >',
            radioGroup:'<div class="ssi-radioGroup <#=options.className#>" id="<#=options.id#>" ><#=radioGroupItems#></div>',
            radio:'<div class="ssi-radioItem"><label><#=options.label#></label><input type="<#=options.type#>"<#=options.checked?"checked":""#>  name="<#=options.name#>"  value="<#=options.value#>"/></div>'
        },
        mainContent: '<div id="ssi-content" tabindex="1"><div id="ssi-menuButtons" class="ssi-menuButtons"></div><div id="ssi-topBarWrapper" class="ssi-topBarWrapper"> <div class="ssi-topBarButtonArea"></div><div id="ssi-topBar" class="ssi-topBar"> <div id="ssi-loader" class="ssi-hidden ssi-loadingIcon ssi-pathLoader"></div><div id="ssi-progressBar" class="ssi-progress"></div></div></div><div id="ssi-mainContent" class="ssi-mainContent"><div id="ssi-items" class="ssi-items"><div id="ssi-contentFiles"></div></div></div></div>',
        bottomButtons: '<div id="ssi-bottomButtons" class="ssi-bottomButtons"><div id="ssi-leftButtons" class="ssi-leftButtons"></div><div id="ssi-rightButtons" class="ssi-rightButtons"></div></div>',
    }
})(jQuery);

(function ($) {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    Ss_input.tools = {
        dirname: function (path) {
            return path.replace(/\\/g, '/')
             .replace(/\/[^\/]*\/?$/, '');
        },
        getExtension: function (file) {
            return file.split('.').pop().toLowerCase();
        },
        basename: function (url) {
            return url.replace(/\\/g, '/').replace(/.*\//, '')
        },
        parseDate: function (input) {
            var parts = input.match(/(\d+)/g);
            return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
        },
        //@author http://weblog.west-wind.com/posts/2008/Oct/13/Client-Templating-with-jQuery
        template: function (str, data) {
            var err = "";
            try {
                var strFunc =
                 "var p=[],print=function(){p.push.apply(p,arguments);};" +
                 "with(obj){p.push('" +
                 str.replace(/[\r\t\n]/g, " ")
                  .replace(/'(?=[^#]*#>)/g, "\t")
                  .split("'").join("\\'")
                  .split("\t").join("'")
                  .replace(/<#=(.+?)#>/g, "',$1,'")
                  .split("<#").join("');")
                  .split("#>").join("p.push('")
                 + "');}return p.join('');";
                var func = new Function("obj", strFunc);
                return func(data);
            } catch (e) {
                err = e.message;
                console.log("< # ERROR: " + err + " # >");
                console.log(e);
            }

        },

        dataReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return '"' + str.replace(/field:\((\w+)\)/g, (str.indexOf('condition:(') > -1 ? '' + dataVariable + '["$1"]' : '"+' + dataVariable + '["$1"]+"')).replace(/condition:(\(.*\))/g, '"+$1+"') + '"';

        }, getField: function (str) {
            return str.replace(/[\s\S]*field:\((\w+)\)[\s\S]*/, '$1')
        }
        , objReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return str.replace(/field:\((\w+)\)/g, (dataVariable + '["$1"]').replace(/condition:(\(.*\))/g, '"+$1+"'));

        },
        fieldReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return str.replace(/field:\((\w+)\)/g, dataVariable + '["$1"]');

        },
        arrayValuesInArray: function (valueArray, array) {
            valueArray = this.toArray(valueArray);

            var unmatched = [];
            for (var i = 0, length = valueArray.length; i < length; i++) {
                if (valueArray[i] && $.inArray(valueArray[i], array) === -1) {
                    unmatched.push(valueArray[i]);
                }
            }
            return unmatched;
        },
        arrayValueInArray: function (array1, array2) {
            for (var i = 0, length = array1.length; i < length; i++) {
                if (array1[i] && $.inArray(array1[i], array2) !== -1) {
                    return true;
                }
            }
            return false;
        },
        keyExists: function (array, obj) {
            array = this.toArray(array);
            var unmatched = [];
            for (var i = 0, length = array.length; i < length; i++) {
                if (array[i] && !obj.hasOwnProperty(array[i])) {
                    unmatched.push(array[i]);
                }
            }
            return unmatched;
        },
        getDate: function () {
            var d = new Date();
            var month = d.getMonth() + 1;
            var day = d.getDate();
            return d.getFullYear() + '-' + (('' + month).length < 2 ? '0' : '') + month + '-' +
             (('' + day).length < 2 ? '0' : '') + day;
        },
        urlUnion: function (url1, url2) {
            var lastIndex = url1.length - 1;
            if (url1[lastIndex] != '/' && url2[0] != '/') url1 += '/';
            else if (url1[lastIndex] === '/' && url2[0] === '/')url2 = url2.substr(1);
            return url1 += url2;
        },
        //@author http://stackoverflow.com/a/7847366/4801797
        cachedImage: function (url) {
            var test = document.createElement("img");
            test.src = url;
            return test.complete || test.width + test.height > 0;
        },
        cutFileName: function (word, ext, maxLength) {
            if (typeof ext === 'undefined')ext = '';
            if (typeof maxLength === 'undefined')maxLength = 10;
            var min = 4;
            if (maxLength < min)return;
            var extLength = ext.length;
            var wordLength = word.length;
            if ((wordLength - 2) > maxLength) {
                word = word.substring(0, maxLength);
                var wl = word.length - extLength;
                word = word.substring(0, wl);
                return word + '...' + ext;

            } else return word;

        },
        toArray: function (element) {
            if (!(element instanceof Array)) {
                element = [element];
            }
            return element;
        },
        findKey: function (value, obj) {
            for (var key in obj) {
                try {
                    if (obj[key] === value)
                        return key;
                } catch (err) {

                }
            }
        }, findByKey: function (array, key, value) {
            for (var i = 0, length = array.length; i < length; i++) {
                if (array[i][key] == value) {
                    return array[i];
                }
            }
            return false;
        },
        editUrl: function (url, path, toRemove) {
            if (path === '')return url.replace(toRemove, '');
            if (url.indexOf(path) < 0) {
                url = this.urlUnion(path, url);
            }
            return url
        },
        removeMirrorValues: function (array) {
            var mirrors;
            do {
                mirrors = false;
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === array[i + 1]) {
                        array.splice(i, 1);
                        mirrors = true;
                    }
                }
            } while (mirrors == true);

        },
        arraySum: function (arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum;
        },
        loadImage: function (element, image, callback) {
            element = element || $();
            var ssi = this.ssi;
            if (!image || image == 'undefined'){
                element.parents('.ssi-itemWrapper').addClass('ssi-empty')
                return;
            }
            if (!Ss_input.tools.cachedImage(image)) {
                var spinner = $('<div class="ssi-loadingIcon ssi-itemLoader"></div>');
                element.append(spinner);
                $('<img/>').attr('src', image).load(function () {
                    $(this).remove();
                    spinner.remove();
                    if (typeof callback === 'function') {
                        callback(true);
                    } else {
                        element.css('background-image', 'url("' + image + '")');
                    }
                }).error(function () {
                    $(this).remove();
                    spinner.remove();
                    if (typeof callback === 'function') {
                        callback(false);
                    } else {
                        element.css('background-image', 'url("' + image + '")');
                    }
                    element.parents('.ssi-itemWrapper').addClass('ssi-empty')
                });
            } else {
                element.css('background-image', 'url("' + image + '")');
            }
        },
        escape: function (text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        },
        escapeHtml: function (string) {
            return String(string).replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
        },
        removeObjFromArray: function (array, key, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] === value) {
                    array.splice(i, 1);
                    break;
                }
            }
        },
        getFirstKey: function (obj) {
            for (var key in obj) return key;
        },
        sanitizeInput: function (str) {
            str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
            return str.trim();
        }
        ,
        removeFromArray: function (array, value) {
            value = this.toArray(value);
            for (var y = 0, vLength = value.length; y < vLength; y++) {
                for (var i = 0, length = array.length; i < length; i++) {
                    if (array[i] === value[y]) {
                        array.splice(i, 1);
                    }
                }
            }
        }
        ,
        removeByKey: function (array, key) {
            key = this.toArray(key);
            for (var i = 0; i < key.length; i++) {
                delete array[key[i]];
            }
        }
        ,
        tooltip: function ($target, text, returnOnly) {
            $target = $($target);
            text = text || $target.data('title');
            if (!text)text = $target.attr('title');
            if (!text)return;
            var $toolTip = $('<div class="ssi-fadeOut ssi-fade ssi-tooltipText">'
             + text +
             '</div>').insertBefore($target);
            $target.one('mouseleave', function () {
                $toolTip.remove();
            });
            if (returnOnly)return $toolTip;
            $toolTip.css({top: $target.position().top - $toolTip.height() - 12, left: $target.position().left})
             .removeClass('ssi-fadeOut');

            return $toolTip;
        }
        ,
        getDataUri: function (url, callback) {//@author https://davidwalsh.name/convert-image-data-uri-javascript
            var image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                canvas.getContext('2d').drawImage(this, 0, 0);
                callback(canvas.toDataURL('image/png'));
            };
            image.src = url;
        }
    }
    ;

    String.prototype.isFile = function (array) {
        if (array)
            return array.indexOf(this.split('/').pop().split('.').pop()) > -1;
        return this
          .split('/').pop()
          .split('.').length > 1;
    };
    String.prototype.fixUrl = function () {
        var length = this.length;
        var url = this;
        if (url[length - 1] !== '/') {
            url += '/'
        }
        return url
    };
    String.prototype.replaceText = function () {
        var args = Array.apply(null, arguments);
        var text = this;
        for (var i = 0; i < args.length; i++) {
            text = text.replace('$' + (i + 1), args[i])
        }
        return text;
    };

    $('body').on('mouseenter', '.ssi-tooltip', function (e) { //----------------------------tooltip----------------------------------------------
         Ss_input.tools.tooltip(e.currentTarget);
     }
    ).on('mouseover', 'div.ssi-dropDownWrapper .parent', function (e) {//----------------------------dropDownMenu----------------------------------------------
        $(e.currentTarget).children('ul').addClass('ssi-show');
        $(e.currentTarget).closest('ul').css('overflow', 'visible')
    }).on('mouseout', 'div.ssi-dropDownWrapper .parent,.ssi-dropOptions li>a', function (e) {
        $(e.currentTarget).children('ul').removeClass('ssi-show');
        $(e.currentTarget).closest('ul').css('overflow', '')
    });

})(jQuery);









(function ($) {
    Ss_input.selectionMode = [];
    Ss_input.selection = [];
    Ss_input.modePlugins['selection'] = Ss_input.Plugin.extend({
        type: 'corePlugins',
        defaults: {
            selectionMode: 'singleSelection',
            excludeItems: '',
            defaultValue: '',
            inputName: '',
            template: '',
            selectionField: '',
            modeOptions: {}
        },
        init: function () {
            this.selectionMode = new Ss_input.selectionMode[this.options.selectionMode](this.ssi, this.setModeOptions());
            this.selectionMode.selection = this;
            this.pluginNames = [];
            for (var pluginName in Ss_input.selection) {
                this.pluginNames.push(pluginName);
            }
            this.selectionMode.init();
            this.setEvents()
             .setHandlers();
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            ssi.$element.on('showAction', function () {
                ssi.pluginInit(thisS.pluginNames, Ss_input.selection);
                ssi.$content.on('click.ssi', '.ssi-canSelect', function (e) {
                    e.preventDefault();
                    if (!e.ctrlKey) {
                        var $e = $(e.target);
                        if (!$e.is('a') && !$e.parent().is('a')) {
                            thisS.selectItem('', ssi.get$mainElement($(e.currentTarget)));
                        }
                    }
                });
                thisS.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                    if (!thisS.options.excludeItems || eval(Ss_input.tools.dataReplace(thisS.options.excludeItems, "item.data")) == 'false') {
                        item.$element.find('.ssi-selectable').addClass('ssi-canSelect');
                    }
                }).on('infoShowAction.ssi', function (e, content) {
                    content.find('.ssi-selectable').click(function (e) {
                        thisS.selectItem('', ssi.get$mainElement($(e.currentTarget)));
                    })
                });
            });
            return this;
        },
        setModeOptions: function () {
            var modeExtraOptions = {};
            if (this.options.defaultValue) {
                modeExtraOptions['defaultValue'] = this.options.defaultValue;
            }
            if (this.options.selectionField) {
                modeExtraOptions['selectionField'] = this.options.selectionField;
            }
            if (this.options.inputName) {
                modeExtraOptions['inputName'] = this.options.inputName;
            }
            if (this.options.template) {
                modeExtraOptions['template'] = this.options.template;
            }
            return $.extend({}, this.options.modeOptions, modeExtraOptions);
        },
        setHandlers: function () {
            this.infoHandler();
            return this;
        },
        selectItem: function (url, eventTarget, relativePath) {
            this.selectionMode.pickData(url, eventTarget, relativePath);
            return this;
        },
        infoHandler: function () {
            Ss_input.handlers['info'] = Ss_input.Handler.extend({
                template: {
                    imagePreview: '<div class="ssi-imagePreview"></div>'
                },
                defaults: {
                    excludeItems: 'condition:(field:(mimeType)=="directory")'
                },
                extend: {
                    handleData: function (dataList) {
                        for (var i = 0, length = dataList.length; i < length; i++) {
                            var preview = this.ssi.plugins['templateManager'].getTemplate(dataList[i], ' ', eval(Ss_input.tools.dataReplace(this.ssi.plugins.scan.options.displayImage, 'dataList[i]')), 'icons');
                            dataList[i] = $.extend({'preview': preview}, dataList[i]);
                        }
                    }
                }
            });
            return this;
        },
        getSelectedInfo: function (id, $target, silent) {
            try {
                var ssi = this.ssi, selectedInfo;
                if (silent) {
                    selectedInfo = {displayImage: id, selection: id, displayName: Ss_input.tools.basename(id)};
                    ssi.$element.trigger('silentSelectionAction.ssi', [selectedInfo]);
                    return selectedInfo;
                }
                id = id || $target.attr('data-ID');
                $target = $target || ssi.get$mainElementById(id);
                var scan = ssi.plugins['scan'], displayName, selection, displayImage;
                var info = $target.data('info');
                if (!info)
                    info = ssi.get$mainElementById(id).data('info');
                if (scan) {
                    displayName = info[scan.options.titleField];
                    displayImage = eval(Ss_input.tools.dataReplace(scan.options.displayImage, 'info'));
                }
                if (this.options.selectionField) {
                    selection = info[this.options.selectionField];
                } else {
                    selection = id;
                }
                selectedInfo = {
                    displayName: (displayName ? Ss_input.tools.escapeHtml(displayName) : Ss_input.tools.basename(id)),
                    selection: selection,
                    displayImage: displayImage
                };
                ssi.$element.trigger('selectionAction.ssi', [selectedInfo]);
                return selectedInfo;
            } catch (err) {
                return {
                    displayName: (displayName ? Ss_input.tools.escapeHtml(displayName) : Ss_input.tools.basename(id)),
                    selection: selection || id,
                    displayImage: displayImage || id
                };
            }
        }
    })
})(jQuery);
(function ($) {
    Ss_input.selectionMode['multiSelection'] = Ss_input.Plugin.extend({
        template: {
            //  dataInput: '<input type="text" placeholder="<#=placeholder#>" class="ssi-dataUrlName" value="<#=value#>" name="<#=name#>" />',
            'inputField': "<td><#=input#></td>",
            vertical: {
                wrapper: '<table class="ssi-selectedItemWrapper  <#=className#> ssi-multiTable"><tr><th></th><# for (var i = 0, inputLength = inputs.length; i<inputLength; i++) { var input=inputs[i]; #><th><#= input.label #></th><#  } #><th></th></tr></table>',
                item: '<tr data-ID="<#=id#>" <#=(dataCollection?"data-collection="+dataCollection:"")#>  class="ssi-removable  ssi-pickItem ssi-vertical <#=className#>"><td class="ssi-imgPosition"><div class="ssi-selectionPreview" style="background-image:url(\'<#=displayImage#>\')"></div><div class="ssi-itemName"><#=displayName#></div></td><#=inputs#><td class="ssi-btnPosition"><!--<#if(!className){#><a href="<#= displayImage #>" data-ssi_imgGroup="selectedImages<#=uniqueId#>" class="ssi-imgPreview ssi-imgBox"><div class="icon ssi-imgBoxIcon"></div></a><#}#>--><a href="#" class="ssi-removeChoice"><div class="icon ssi-removeIcon"></div></a></td><input type="hidden" name="<#=inputName#>" value="<#= selectionField #>"/></tr>'
            },
            displayFiles: '<div id="ssi-displayFilesWrapper"><button id="ssi-clearSelected" data-title="<#=selectedBtn#>" class="ssi-clearBtn ssi-mBtn ssi-tooltip"><div class="icon ssi-cleanBtn"></div></button><div data-title="<#=selectedTooltip#>" class="ssi-tooltip ssi-displayFiles"><#=selected#></div><button id="ssi-clearChecked" data-title="<#=checkedBtn#>" class="ssi-mBtn ssi-clearBtn ssi-tooltip"><div class="icon ssi-cleanBtn"></div></button><div id="ssi-displayCheckedFiles" data-title="<#=checkedTooltip#>" class="ssi-displayFiles ssi-tooltip"><#=checked#></div></div>'
        },
        defaults: {
            template: 'vertical',
            className: '',
            duplicate: true,
            inputName: 'files[]',
            selectionField: 'id',
            maxItems: 0,
            content: '',
            input: [],
            defaultValue: ''
        },
        init: function () {
            this.checkedItems = [];
            this.selected = [];
            this.silentItems = [];
            this.selectedFilesCount = 0;
            this.checkedFilesCount = 0;
            var ssi = this.ssi;
            ssi.$element.addClass('ss-input ssi-multiPickMode');
            $(this.options.content).eq(0).html(Ss_input.tools.template(this.template[this.options.template].wrapper, {
                className: this.options.className,
                inputs: this.options.input
            }));

            if (this.options.defaultValue) {
                var length = this.options.defaultValue.length;
                if (this.options.maxItems !== 0 && length > this.options.maxItems)length = length - this.options.maxItems;
                for (var i = 0; i < length; i++) {
                    this.checkedItems.push(this.options.defaultValue[i].value)
                }
                this.selectItems(this.options.defaultValue);
            }
            if (!!this.options.maxItems && (Math.log(this.options.maxItems) * Math.LOG10E + 1 | 0) > 3) {
                this.options.maxItems = 9999;
            }
            this.setButtons();
            this.setEvents();
            return this;
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton([{
                label: this.translate('insert'),
                className: "ssi-mBtn ssi-insertBtn disabled",
                closeAfter: true,
                enableAfter: true,
                method: function () {
                    thisS.selectItems();
                    if (thisS.ssi.options.showTo != 'modalWindow')
                        thisS.reset();
                }
            }, {
                closeAfter: true,
                label: this.translate('cancel'),
                className: "ssi-mBtn ssi-cancel"
            }], 'menuButton', ['bottom']);
        },
        setEvents: function () {
            var thisS = this, ssi = this.ssi;
            ssi.$element.on('showAction', function () {
                if (!thisS.options.duplicate) {
                    thisS.checkItem(thisS.selected);
                    thisS.checkedFilesCount = thisS.selected.length;
                }
                ssi.$content.find('#ssi-menuButtons').after(Ss_input.tools.template(thisS.template.displayFiles, {
                    selected: (!!thisS.options.maxItems ? '<span id="ssi-displaySelectedFiles">' + thisS.selectedFilesCount + '</span>/' + thisS.options.maxItems : '<span id="ssi-displaySelectedFiles">' + thisS.selectedFilesCount + '</span>'),
                    checked: thisS.checkedFilesCount,
                    selectedTooltip: thisS.translate('selectedTooltip'),
                    checkedTooltip: thisS.translate('checkedTooltip'),
                    checkedBtn: thisS.translate('checkedBtn'),
                    selectedBtn: thisS.translate('selectedBtn')
                }));
                ssi.$content.on('click', '#ssi-clearChecked', function () {
                    thisS.clearChecked();
                    return false;
                }).on('click', '#ssi-clearSelected', function () {
                    thisS.clearSelected();
                    return false;
                });
                ssi.$element.on('echoItemsAction.ssi silentEchoItemsAction.ssi', function () {
                    thisS.setMChecked();
                }).on('closeAction.ssi', function () {
                    thisS.checkedFilesCount = 0;
                    thisS.checkedItems = [];
                }).on('appendItemAction.ssi', function (e, item) {
                    if ($.inArray(item.data.path, thisS.checkedItems) !== -1) {
                        thisS.addCheck('', item.$element.find('.ssi-canSelect'));
                    }
                }).on('infoCloseAction.ssi', function () {
                    thisS.setMChecked()
                }).on('infoShowAction.ssi', function (e, content) {
                    thisS.setMChecked(content)
                }).on('beforeChangeCollectionAction.ssi', function () {
                    thisS.selectItems();
                    thisS.reset();
                }).on('removeItemAction.ssi', function (e, id) {
                    var checkedIndex = $.inArray(id, 'thisS.checkedItems')
                })
            });
            $(this.options.content).eq(0).on('click', '.ssi-removeChoice', function (e) {
                try {
                    thisS.removeSelectedImage(e);
                    thisS.selectedFilesCount--;
                    thisS.ssi.$content.find('#ssi-displaySelectedFiles').html(thisS.selectedFilesCount);
                } catch (err) {
                }
                return false;
            });
        },
        reset: function () {
            this.checkedFilesCount = 0;
            this.checkedItems = [];
            if (!this.options.duplicate) {
                this.checkItem(this.selected);
                this.checkedFilesCount = this.selected.length;
            } else {
                this.ssi.$content.find('#ssi-displayCheckedFiles').html('0');
                this.ssi.$content.find('.ssi-checked').removeClass('ssi-checked')
                 .find('.ssi-checkItem').remove();
            }
            this.ssi.$content.find('#ssi-displaySelectedFiles').html(this.selectedFilesCount);
        },
        selectItems: function (defaults) {
            var $content = $(this.options.content).eq(0), item, content = [], defaultValue = '';
            if (!this.options.duplicate) this.duplicate();
            var length = this.checkedItems.length;
            for (var y = 0; y < length; y++) {
                if (defaults) defaultValue = defaults[y].input || [];
                var id = this.checkedItems[y];
                if (typeof this.radioButtons === 'undefined' || this.radioButtons) {
                    for (var i = 0, inputLength = this.options.input.length; i < inputLength; i++) {
                        if (this.options.input[i].type === 'radio') {
                            this.radioButtons = true;
                            this.options.input[i].name = (this.options.input[i].name.replace(/\[[0-9]*]/, "[" + this.selectedFilesCount + "]"));
                        }
                        if (!this.radioButtons)this.radioButtons = false;
                    }
                }
                item = this.getTemplate(id, defaultValue, !!this.silentItems[y]);
                if (item) {
                    content.push(item);
                    this.selectedFilesCount++;
                }
            }
            $content.children('.ssi-selectedItemWrapper').append(content);
            this.checkedItems = [];
        },
        getTemplate: function (id, defaultValue, silent) {
            var inputs = "", className = '', idSplit = id.split(/:(.+)?/, 2);
            silent = silent || !!defaultValue;
            id = idSplit[1] || id;
            for (var i = 0, length = this.options.input.length; i < length; i++) {
                inputs += Ss_input.tools.template(this.template.inputField, {input: new Ss_input.Input(this.options.input[i], defaultValue[i])[0].outerHTML}
                )
            }
            var itemInfo = this.selection.getSelectedInfo(id, '', silent);
            if (!itemInfo.displayImage) {
                className = 'ssi-empty';
            }
            return Ss_input.tools.template(this.template[this.options.template].item, {
                inputName: this.options.inputName,
                selectionField: itemInfo.selection,
                id: id,
                className: className,
                displayImage: itemInfo.displayImage,
                uniqueId: this.ssi.uniqueId,
                inputs: inputs,
                displayName: itemInfo.displayName,
                dataCollection: idSplit[1] ? idSplit[0] : ""
            });
        },
        pickData: function (id, target, silent) {
            if (!this.options.duplicate && silent) {
                if ($.inArray('/:' + id, this.checkedItems) > -1) {
                    this.ssi.notify('error', this.translate('existInListError'));
                    return this;
                }
            }
            var $target;
            if (target) {
                $target = $(target);
            } else {
                $target = this.ssi.get$mainElementById(id);
            }
            id = this.ssi.currentCollection.id + ':' + (id || target.attr('data-ID'));

            if (!id) {
                console.log('Cant\'t find the id.');
                return this;
            }

            if ($target.hasClass('ssi-checked')) {
                this.checkedFilesCount--;
                this.removeCheck('', $target);
                this.unCheckItem(id);
            } else {

                if (this.options.maxItems !== 0 && (this.options.duplicate ? this.selectedFilesCount + this.checkedFilesCount : this.checkedFilesCount) === this.options.maxItems) {
                    this.ssi.notify('error', this.translate('limitError').replaceText(this.options.maxItems.toString()));
                    return;
                }

                this.checkedFilesCount++;
                this.addCheck('', $target);
                this.checkItem(id, silent);
            }
            this.ssi.$content.find('#ssi-displayCheckedFiles').html(this.checkedFilesCount)
            return this;
        },
        setMChecked: function ($content) {
            var ssi = this.ssi, id, valueSplit;
            $content = $content || ssi.$content;
            var ssi_mSelect = this.checkedItems.filter(function (value) {
                valueSplit = value.split(/:(.+)?/, 2);
                return (valueSplit[0] == ssi.currentCollection.id || !valueSplit[1]);
            });
            $content.find('span.ssi-checkItem').remove();
            for (var i = 0, length = ssi_mSelect.length; i < length; i++) {
                valueSplit = ssi_mSelect[i].split(/:(.+)?/, 2);
                id = valueSplit[1] || valueSplit[0];
                this.addCheck(id, '', $content);
            }
        },
        removeCheck: function (id, target) {
            var $target;
            if (target) {
                $target = $(target);
            } else {
                $target = this.ssi.get$mainElementById(id);
            }
            $target.removeClass('ssi-checked');
            $target.find('.ssi-checkItem').remove();
        },
        removeSelectedImage: function (e) {
            var item = $(e.target).parents('.ssi-pickItem');
            if (!this.options.duplicate) {
                var id = item.attr('data-ID');
                var collection = item.attr('data-collection');
                Ss_input.tools.removeFromArray(this.selected, collection ? collection + ':' + id : id);
            }
            item.remove();
            if (this.radioButtons) {
                setRadioNames(this);
            }
        },
        addCheck: function (id, target, $content) {
            var $target;
            if (target) {
                $target = $(target);
            } else {
                $target = this.ssi.get$mainElementById(id, $content);
            }
            $target.append('<span class="icon ssi-checkItem"></span>')
             .addClass('ssi-checked');
        },
        checkItem: function (id, silent) {
            if (id instanceof Array) {
                this.checkedItems = this.checkedItems.concat(id)
            } else {
                if (silent) {
                    if (this.options.duplicate) {
                        this.silentItems[this.checkedItems.length] = silent;
                    } else {
                        this.silentItems[Ss_input.tools.arrayValuesInArray(this.checkedItems, this.selected).length] = silent;
                    }
                }
                this.checkedItems.push(id);
            }
            this.ssi.$content.parents('.ssi-mainModal').find('.ssi-insertBtn')
             .removeClass('disabled')
             .prop("disabled", false);
        },
        unCheckItem: function (id) {
            id = id.split(/:(.+)?/, 2);
            id = id[1] || id[0];
            Ss_input.tools.removeFromArray(this.checkedItems, id);
            if (this.checkedItems.length === 0) {
                $('.ssi-insertBtn')
                 .addClass('disabled')
                 .prop("disabled", true);
            }
        },
        duplicate: function () {
            var newItems = Ss_input.tools.arrayValuesInArray(this.checkedItems, this.selected),
             removedItems = Ss_input.tools.arrayValuesInArray(this.selected, this.checkedItems), dataSplit, id;
            this.selected = this.checkedItems.slice();
            var $content = $(this.options.content).eq(0).children('.ssi-selectedItemWrapper');
            for (var i = 0; i < removedItems.length; i++) {
                dataSplit = removedItems[i].split(/:(.+)?/, 2);
                id = dataSplit[1] || dataSplit[0];
                $content.find('.ssi-pickItem[data-ID="' + id + '"]').each(function () {
                    var $this = $(this);
                    var collection = $this.attr('data-collection');
                    if (!collection || collection == dataSplit[0])
                        $this.remove();
                });
                this.selectedFilesCount--;
            }
            this.checkedItems = newItems;
        },
        clearChecked: function () {
            var ssiContent = this.ssi.$content;
            ssiContent.find('.ssi-checkItem').remove();
            ssiContent.find('.ssi-checked').removeClass('ssi-checked');
            ssiContent.find('#ssi-displayCheckedFiles').html(0);
            if (!this.duplicate) {
                ssiContent.find('#ssi-displaySelectedFiles').html(this.selectedFilesCount - this.checkedFilesCount);
            }
            this.checkedFilesCount = 0;
            this.checkedItems = [];
            ssiContent.parents('.ssi-mainModal').find('.ssi-insertBtn')
             .addClass('disabled')
             .prop("disabled", true);
        },
        clearSelected: function () {
            $(this.options.content).eq(0).find('.ssi-pickItem').remove();
            this.ssi.$content.find('#ssi-displaySelectedFiles').html((this.duplicate ? 0 : this.checkedFilesCount));
            this.selectedFilesCount = 0;
            this.selected = [];
        }
    });
    function setRadioNames(thisS) {
        var radio = $(thisS.options.content).eq(0).find('.ssi-radioGroup');
        for (var i = 0, length = radio.length; i < length; i++) {
            (function (i) {
                radio.eq(i).find('input').attr('name', function (h, val) {
                    $(this).attr('name', val.replace(/\[[0-9]*]/, "[" + i + "]"));
                });
            })(i);
        }
    }

})(jQuery);
(function ($) {
    Ss_input.selectionMode['singleSelection'] = Ss_input.Plugin.extend({
        template: {
            imgHolder: '<table class="ssi-pickItem ssi-selectedItemWrapper ssi-itemWrapper"><tr><td class="ssi-imgHolder"><div class="ssi-selectionPreview"><div id="ssi-actions"><!--<a href="#" id="ssi-pickedImg" class="ssi-imgBox ssi-imgPreview ssi-hidden"><div class="icon ssi-imgBoxIcon"></div></a>--><a href="#" class="ssi-removeChoice ssi-hidden"><div class="icon ssi-removeIcon"></div></a></div><div id="ssi-imgChoose" class="ss-input ssi-pick ssi-selectionPreview"></div></div></td></tr><tr><td><div class="ssi-itemName"></div></td></tr><#=input#></table>',
            textHolder: '<div class="ssi-pickItem ssi-selectedItemWrapper ssi-itemWrapper"><span class="ssi-textPreview"></span><#= input #></div><a href="#" class="ssi-removeChoice"><div class="icon ssi-removeIcon"></div></a>',
            input: '<input type="<#=(type||"text")#>" placeholder="<#=placeholder#>" class="ssi-dataUrlName" value="<#=value#>" name="<#=name#>" />',
            mainInput: '<input type="hidden" class="ssi-mainInput" name="<#=name#>"/>'
        },
        defaults: {
            template: 'imgHolder',
            defaultValue: '',
            selectionField: '',
            inputName: ''
        },
        init: function () {
            var ssi = this.ssi;
            if (!ssi.$element.is('div')) {
                console.log('The targeted element is not a div.');
                return;
            }
            ssi.$element.addClass('ssi-' + this.options.template);
            ssi.$element.append(Ss_input.tools.template(this.template[this.options.template], {input: '<input type="hidden" class="ssi-mainInput" name="' + this.options.inputName + '"/>'}));
            if (this.options.defaultValue) {
                this.pickData(this.options.defaultValue, '', true);
            }
            this.setEvents();
            return this;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('click', '.ssi-removeChoice', function (e) {
                e.preventDefault();
                thisS.removeSelectedImage();
                return false;
            }).on({
                mouseenter: function () {
                    $(this).find('#ssi-actions')
                     .fadeIn(200);
                },
                mouseleave: function () {
                    $(this).find('#ssi-actions')
                     .fadeOut(200);
                }
            }, '.ssi-selectionPreview');
            return this;

        },
        pickData: function (id, target, silent) {
            var $target = $(target);
            id = id || $target.attr('data-ID');
            if (!id) {
                console.log('Cant\'t find the id.');
                return this;
            }
            var info = this.selection.getSelectedInfo(id, target, silent);
            var ssi = this.ssi;
            ssi_modal.closeAll();
            ssi.$element.find('a').removeClass('ssi-hidden');
            ssi.$element.find('.ssi-itemName').html(info.displayName );
            ssi.$element.find('.ssi-itemWrapper').removeClass('ssi-empty');
            Ss_input.tools.loadImage( ssi.$element.find('#ssi-imgChoose'),info.displayImage);
            ssi.$element.find('.ssi-mainInput').val(info.selection);
            return this;
        },
        removeSelectedImage: function () {
            var ssi = this.ssi;
            ssi.$element.find('.ssi-itemWrapper').removeClass('ssi-empty');
            ssi.$element.find('#ssi-imgChoose').css("background-image", '');
            ssi.$element.find('a').addClass('ssi-hidden');
            ssi.$element.find('.ssi-itemName').html('');
            ssi.$element.find('#' + ssi.options.inputName).val('');
            return this;
        }

    });
})(jQuery);
(function ($) {
    Ss_input.selectionMode['textEditorSelection'] = Ss_input.Plugin.extend({
        defaults: {
            method: function () {
            }
        }, init: function () {
            this.ssi.mode = 'textEditorSelect';
            this.ssi.$element.addClass('ss-input');
            return this;
        },
        pickData: function (id, target) {
            var selectionField = this.selection.getSelectedInfo(id, target).selection;
            if (typeof this.options.method === 'function')
                this.options.method(selectionField);
            ssi_modal.closeAll();
            return this;
        }
    });
})(jQuery);
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
                if (!data.isFile(thisS.options.allowed))
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
(function ($) {
    var back = false;
    Ss_input.fileSystem['history'] = Ss_input.Plugin.extend({
        template: {
            back: '<a href="#" id="ssi-backHistory" class="disabled ssi-historyBack"><div class="icon ssi-backIcon"></div></a>',
            fw: '<a href="#" id="ssi-fwHistory" class="ssi-historyFw disabled"><div class="icon ssi-fwIcon"></div></a>',
            up: '<a href="#" id="ssi-historyUp" class="ssi-historyUp disabled"><div class="icon ssi-upIcon"></div></a>'
        },
        init: function () {
            this.backHistory = [];
            this.fwHistory = [];
            this.setButtons();
            this.setEvents();
        },
        setButtons: function () {
            var thisS = this;
            var $back = $(this.template.back);
            var $fw = $(this.template.fw);
            var $up = $(this.template.up);
            var ssi = this.ssi;
            $back.on('click', function (e) {
                thisS.historyBack($(this));
                return false;
            });
            $fw.on('click', function (e) {
                if (thisS.fwHistory.length > 0)
                    thisS.historyFw($(this));
                return false;
            });
            $up.on('click.ssi', function (e) {
                if (ssi.readOnlyMode)
                    thisS.historyBack();
                else
                    thisS.ssi.fileSystem.scanDir(Ss_input.tools.dirname(ssi.currentCollection.id));
                return false;
            });
            ssi.$content.find('.ssi-topBarButtonArea').append($back, $fw, $up);
        },
        setEvents: function () {
            var thisS = this, ssi = this.ssi;
            ssi.$element.on('echoItemsAction.ssi', function () {
                if (ssi.currentCollection.id !== '/') {
                    thisS.ssi.$content.find('#ssi-historyUp').removeClass('disabled');
                } else {
                    thisS.ssi.$content.find('#ssi-historyUp').addClass('disabled');
                }
                if (back) {
                    back = false;
                    return;
                }
                var length = thisS.backHistory.length;
                if (length > 0 && ssi.currentCollection.id !== '/') {
                    thisS.ssi.$content.find('#ssi-backHistory').removeClass('disabled');
                }
                if (thisS.backHistory[length - 1] !== ssi.currentCollection.id && !ssi.readOnlyMode) {
                    if (length >= 20) thisS.backHistory.shift();
                    thisS.backHistory.push(ssi.currentCollection.id);
                    thisS.fwHistory = [];
                    ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                }
            }).on('closeAction.ssi', function () {
                thisS.backHistory = ['/'];
                thisS.fwHistory = [];
                back = false;
            }).on('removeCollectionAction.ssi', function (e, id) {
                thisS.removeFromHistory(id)
            });
        },
        historyFw: function ($btn) {
            back = true;
            $btn = $btn || this.ssi.$content.find('#ssi-fwHistory');
            var length = this.fwHistory.length;
            this.ssi.$content.find('#ssi-backHistory').removeClass('disabled');
            if (length === 1) $btn.addClass('disabled');
            var data = this.fwHistory[length - 1];
            this.ssi.fileSystem.scanDir(data);
            this.backHistory.push(data);
            this.fwHistory.splice(length - 1, 1);
        },
        historyBack: function ($btn) {
            $btn = $btn || this.ssi.$content.find('#ssi-backHistory');
            back = true;
            var ssi = this.ssi;
            var length = this.backHistory.length;
            if (length < 1)return;
            if (length == 2) $btn.addClass('disabled');
            if (!ssi.readOnlyMode) {
                if (length < 2){
                    $btn.addClass('disabled');
                    return;
                }
                ssi.fileSystem.scanDir(this.backHistory[length - 2]);
                this.fwHistory.push(this.backHistory[length - 1]);
                this.backHistory.splice(length - 1, 1);
                ssi.$content.find('#ssi-fwHistory').removeClass('disabled');
            } else {
                ssi.fileSystem.scanDir(this.backHistory[length - 1]);
                if (length === 1) $btn.addClass('disabled');
            }
        },
        removeFromHistory: function (path) {
            if (this.backHistory.length > 0) {
                Ss_input.tools.removeFromArray(this.backHistory, path);
                Ss_input.tools.removeMirrorValues(this.backHistory);
                if (this.backHistory.length < 2) {
                    this.ssi.$content.find('#ssi-backHistory').addClass('disabled');
                }
            }
            if (this.fwHistory.length > 0) {
                Ss_input.tools.removeFromArray(this.fwHistory, path);
                Ss_input.tools.removeMirrorValues(this.fwHistory);
                if (this.fwHistory.length < 1) {
                    this.ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                } else if (this.fwHistory.length == 1 && this.fwHistory[0] == this.ssi.currentCollection.id) {
                    this.fwHistory = [];
                    this.ssi.$content.find('#ssi-fwHistory').addClass('disabled');
                }
            }
        },
        cleanHistory: function () {
            this.fwHistory = [];
            this.backHistory = [];
        }
    })
})(jQuery);
(function ($) {
    Ss_input.fileSystem['path'] = Ss_input.Plugin.extend({
        template: {
            pathBar: '<div style="float:left" id="ssi-loading"></div><div class="ssi-homePath" style="float:left"><a href="#" data-ID="/" class="<#=className#> ssi-path"><div class="icon ssi-rootIcon"></div><#=rootName#></a></div><div class="ssi-currentPath"></div>',
            pathItem: '<div class="ssi-pathItemWrapper"><div class="icon ssi-breadcrumbsIcon"></div><a href="#" data-ID="<#=dataHref#>" class="<#=className#> ssi-path"><#=pathName#></a></div>'
        },
        defaults: {
            className: '',
            rootName: 'root'
        },
        init: function () {
            this.ssi.$content.find('#ssi-topBar').append(Ss_input.tools.template(this.template.pathBar, {
                className: this.options.className,
                rootName: this.options.rootName
            }));
            this.setEvents();
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$content.on('click.ssi', '.ssi-path', function () {
                var $this=$(this);
                if($this.hasClass('ssi-alias'))return false;
                thisS.ssi.fileSystem.scanDir($this.attr('data-ID'));
                return false;
            });
            this.ssi.$element.on('beforeEchoItemsAction.ssi', function (e) {
                var page=thisS.ssi.currentCollection;
                if (!page.id)return;

                var path = page.alias || thisS.ssi.currentCollection.id,
                 dataHref = '' || page.href;
                thisS.setPath(path, dataHref);
            });
        },
        setPath: function (pathName, href) {
            var ssi = this.ssi;
            var currentPath = ssi.$content.find('.ssi-currentPath');
            if (href) {
                currentPath.html(Ss_input.tools.template(this.template.pathItem, {
                    dataHref: href,
                    className: 'ssi-alias',
                    pathName: pathName
                }));
                return;
            }
            var path = pathName.split('/'), dataHref = '', adrArray = []
             , length = path.length
             , pathWidth = (currentPath.outerWidth() - 100), pathLength = 0;
            currentPath.html('');
            for (var i = 0; i < length; i++) {
                if (dataHref != pathName) {
                    dataHref = Ss_input.tools.urlUnion(dataHref, path[i]);
                }
                if (path[i] != '/' && path[i] != '') {
                    var link = Ss_input.tools.template(this.template.pathItem, {
                        dataHref: dataHref,
                        className: this.options.className,
                        pathName: path[i]
                    });
                    adrArray.push(link);
                    var $link = $(link);
                    pathLength += $link.hide().appendTo(currentPath).outerWidth();
                    $link.remove();
                }
            }
            i = 0;
            while (pathLength > pathWidth && pathWidth > 0 && i < path.length) {
                adrArray.shift();
                $link = $(Ss_input.tools.template(this.template.pathItem, {
                    dataHref: dataHref,
                    className: this.options.className,
                    pathName: path[i + 1]
                }));
                pathLength = pathLength - $link.hide().appendTo(currentPath).outerWidth();
                $link.remove();
                i++;
            }
            if (adrArray.length) {
                currentPath.html(adrArray);
            }
        }
    });

})(jQuery);
(function ($) {
    Ss_input.database = [];
    Ss_input.databaseHandlers = [];
    Ss_input.storageTypes['database'] = Ss_input.Plugin.extend({
        type: 'corePlugins',

        template: {
            title: '<h4 id="ssi-collectionTitle"></h4>',
            topBar: '<div class="ssi-topButtonsWrapper"><div id="ssi-topButtons" class="ssi-topButtons"></div></div>',
            form: '<form id="ssi-formData"><table><#=formItem#></table></form>',
            formItem: '<tr><th><label for="<#=inputId#>" class="<#=labelClass#>"><#=label#></label></th><td><#=input#></td></tr>'
        },
        defaults: {
            translateFields: false,
            sendNullValues: false,
            responseValidation: false,
            baseCollection: '',
            collections: {
                /*Images: {

                 baseUrl: '/!*http://localhost:9000/api/things*!/',
                 schema: {
                 "_id": {type: 'string',edit: false, id: true, search: true},
                 "name": {type: 'string', required: true, displayName: true},
                 "contentType": {type: 'string', required: true, search: true, default: 'image/jpeg'},
                 "type": {type: 'string', default: 'dds', sort: true},
                 "image": {type: 'string', inputType: 'textarea', displayImage: true},
                 "date": {type: 'date', edit: false, default: 'now', sort: true},
                 "active": {type: 'boolean', required: true, default: '3'}
                 }
                 }*/
            }
        },
        init: function () {
            this.ssi.options.translateFields = this.options.translateFields;
            this.ssi.options.responseValidation = this.options.responseValidation;
            this.ssi.handlersGroup = 'databaseHandlers';
            this.currentCollection = '';
            this.pluginNames = [];
            for (var pluginName in Ss_input.database) {
                this.pluginNames.push(pluginName);
            }
            this.setCurrentCollection();
            this.setEvent();
        },
        setEvent: function () {
            var thisS = this, ssi = this.ssi;
            ssi.$element.on('earlyShowAction', function () {
                thisS.setStaticHandlers()
                 .setSchema();
            }).on('showAction', function () {
                ssi.$content.find('#ssi-topBar').append(thisS.template.title);
                ssi.pluginInit(thisS.pluginNames, Ss_input.database);
                if (thisS.options.baseCollection !== false)
                    thisS.scanCollection(thisS.currentCollection.title);
                ssi.$content.on('click.ssi', '.ssi-collectionScan .ssi-listAnchor', function (e) {
                    if (ssi.readyState == false)return false;
                    var $target = $(e.currentTarget);
                    var title = $target.text();
                    if (thisS.currentCollection.title == title)return false;
                    thisS.scanCollection(title);
                    return false;
                });
                ssi.$element.on('beforeScanAction.ssi', function (e, page) {
                    if ($.isEmptyObject(thisS.currentCollection.schema)) {
                        thisS.schemaAutoGenerator(page.data)
                         .currentCollection.schema = thisS.options.collections[thisS.currentCollection.title].schema;
                        thisS.setSchema()
                         .changeSchema();
                    }
                });
            }).on('silentSelectionAction.ssi', function (e, selectedInfo) {
                if (!selectedInfo.displayImage.isFile(['jpg', 'png', 'jpeg'])) {
                    selectedInfo.displayImage = '';
                }
            });
            return this;
        },
        setCurrentCollection: function () {
            try {
                if (this.options.baseCollection) {
                    this.currentCollection = this.options.collections[this.options.baseCollection];
                }
                if (!this.currentCollection) {
                    var firstKey = Ss_input.tools.getFirstKey(this.options.collections);
                    this.currentCollection = this.options.collections[firstKey] || {}
                }
                this.currentCollection.title = this.options.baseCollection || firstKey;

            } catch (err) {
                }
        },
        scanCollection: function (title) {
            this.currentCollection = this.options.collections[title];
            this.currentCollection.title = title;
            this.ssi.$element.trigger('beforeChangeCollectionAction.ssi');
            this.setTitle(this.currentCollection.title);
            if (this.currentCollection.schema) {
                if (!this.currentCollection.isSet)
                    this.setSchema();
                this.changeSchema();
            }
            this.ssi.plugins.scan.scanCollection(title, this.currentCollection.baseUrl.replace('/:id', ''));
        },
        setTitle: function (title) {
            try {
                this.ssi.$content.find('#ssi-collectionTitle').html(title);
            } catch (err) {

            }
        },
        setSchema: function () {
            var currentCollection = this.currentCollection;
            var schema = currentCollection.schema;
            if (!currentCollection.search) {
                currentCollection.search = [];
            }
            if (!currentCollection.sort) {
                currentCollection.sort = [];
            }
            if (!currentCollection.details) {
                currentCollection.details = [];
            }
            var searchLength = currentCollection.search.length,
             sortLength = currentCollection.sort.length,
             detailsLength = currentCollection.details.length;
            if (schema && !$.isEmptyObject(schema)) {
                for (var fieldName in schema) {
                    var field = schema[fieldName];
                    if (!currentCollection.displayName && field.displayName)currentCollection.displayName = fieldName;
                    if (!currentCollection.displayImage && field.displayImage)currentCollection.displayImage = 'field:(' + fieldName + ')';
                    if (!currentCollection.selectionField && field.selectionField)currentCollection.selectionField = fieldName;
                    if (!currentCollection.id && field.id)currentCollection.id = fieldName;
                    if (!detailsLength && field.details == false)currentCollection.details.push(fieldName);
                    if (!searchLength && field.search)currentCollection.search.push(fieldName);
                    if (!sortLength && field.sort)currentCollection.sort.push(fieldName);
                }
                if (!currentCollection.sort.length)currentCollection.sort = [Ss_input.tools.getFirstKey(schema)];
                currentCollection.isSet = true;
            }
            this.setHandlers();
            return this;
        },
        changeSchema: function () {
            var currentCollection = this.currentCollection;
            this.ssi.$element.trigger('changeSchemaAction.ssi', {
                displayName: currentCollection.displayName,
                id: currentCollection.id,
                displayImage: currentCollection.displayImage || '',
                url: currentCollection.baseUrl,
                sort: currentCollection.sort,
                search: currentCollection.search,
                details: currentCollection.details
            });
            return this;
        },
        schemaAutoGenerator: function (data) {
            data = data[0];
            if (!data) {
                console.log('Cannot create schema from empty collection');
                return this;
            }
            var limit = 3, index = -1, reg;
            var currentCollection = this.currentCollection;
            var schema = this.options.collections[currentCollection.title].schema = {};
            for (var fieldName in data) {
                if (!data.hasOwnProperty(fieldName))continue;
                index++;
                var type = typeof data[fieldName];
                schema[fieldName] = {type: type};
                if (type == 'object' && data[fieldName] instanceof Array) {
                    schema[fieldName].type = 'array';
                }
                if (type == 'string' && data[fieldName].split(' ').length > 10) {
                    schema[fieldName].inputType = 'textarea';
                }
                if (index < limit) {
                    schema[fieldName].search = true;
                    schema[fieldName].sort = true;
                }
                if (!currentCollection.id) {
                    reg = new RegExp("(?:[a-z]*(?:_id|id_|Id|-id|id-)[a-z]*)|^(?:id|ID)(?:$|[A-Z]+.*)");
                    if (reg.test(fieldName)) {
                        schema[fieldName].id = true;
                        continue;
                    }
                }
                if (!currentCollection.displayName) {
                    reg = new RegExp("(?:[a-z]*(?:_title|title_|Title|-title|title-|_name|name_|Name|-name|name-)[a-z]*)|^(?:title|name|username|login)(?:$|[A-Z]+.*)");

                    if (reg.test(fieldName)) {
                        schema[fieldName].displayName = true;
                        continue;
                    }
                }
                if (!currentCollection.displayImage) {
                    reg = new RegExp("(?:[a-z]*(?:_image|image_|Image|-image|image-|_img|img_|Img|-img|img-|_avatar|avatar_|Avatar|-avatar|avatar-)[a-z]*)|^(?:image|img|avatar)(?:$|[A-Z]+.*)");
                    if (reg.test(fieldName)) {
                        schema[fieldName].displayImage = true;
                    }
                }
            }
            return this;
        },
        setHandlers: function () {
            this.scanHandler()
             .imgBoxHandler()
             .searchHandler()
             .sortHandler()
             .infoBubbleHandler()
             .deleteHandler()
             .selectionHandler()
             .templateManagerHandler();

            return this;
        },
        setStaticHandlers: function () {
            this.sidebarHandler();
            return this
        },
        templateManagerHandler: function () {
            Ss_input.databaseHandlers['templateManager'] = Ss_input.Handler.extend({
                defaults: {
                    template: 'details',
                    excludeFields: this.currentCollection.details
                }
            });
            return this;
        },
        scanHandler: function () {
            Ss_input.databaseHandlers['scan'] = Ss_input.Handler.extend({
                defaults: {
                    titleField: this.currentCollection.displayName,
                    idField: this.currentCollection.id,
                    displayImage: (this.currentCollection.displayImage || '')
                }
            });
            return this;
        },
        selectionHandler: function () {
            var selection = this.ssi.corePlugins['selection'];
            if (selection) {
                selection.options.selectionField = this.currentCollection.selectionField
            }
            return this;
        },
        imgBoxHandler: function () {
            Ss_input.databaseHandlers['imgBox'] = Ss_input.Handler.extend({
                defaults: {
                    imageField: this.currentCollection.displayImage
                }
            });
            return this;
        },
        deleteHandler: function () {
            Ss_input.databaseHandlers['delete'] = Ss_input.Handler.extend({
                defaults: {
                    sendId: 'inUrl',
                    ajaxOptions: {
                        url: this.currentCollection.baseUrl
                    }
                }
            });
            return this;
        },
        searchHandler: function () {
            Ss_input.databaseHandlers['search'] = Ss_input.Handler.extend({
                defaults: {
                    deepSearch: false,
                    searchFields: this.currentCollection.search
                }
            });
            return this;
        },
        sidebarHandler: function () {
            var sidebarData = [];
            var collections = this.options.collections;
            if (Object.keys(collections).length < 2) {
                this.ssi.options.excludePlugin.push('sidebar');
                return;
            }
            for (var collectionName in collections) {
                if (!collections[collectionName].baseUrl)continue;
                sidebarData.push({
                    name: collectionName,
                    url: collections[collectionName].baseUrl,
                    className: 'ssi-collectionScan'
                })
            }
            Ss_input.databaseHandlers['sidebar'] = Ss_input.Handler.extend({
                defaults: {
                    data: sidebarData,
                    className: '',
                    resizable: false,
                    mode: 'dropDown'
                }
            });
            return this;
        },
        sortHandler: function () {
            Ss_input.databaseHandlers['sort'] = Ss_input.Handler.extend({
                defaults: {
                    sortableFields: this.currentCollection.sort
                }
            });
            return this;
        },
        infoBubbleHandler: function () {
            Ss_input.databaseHandlers['infoBubble'] = Ss_input.Handler.extend({
                defaults: {
                    excludeFields: this.currentCollection.details,
                    translateFields: this.options.translateFields
                }
            });
            return this;
        },
        getForm: function (defaultData) {
            defaultData = defaultData || {};
            var formTypes = {
                'number': 'text',
                'string': 'text',
                'date': 'text',
                'enum': 'select',
                'boolean': 'select',
                'object': 'textarea'
            };
            var ssi = this.ssi,
             schema = this.currentCollection.schema,
             className, formItem = '';
            for (var name in schema) {
                var schemaObj = schema[name];
                if (schemaObj.edit == false)continue;
                if (typeof defaultData[name] !== 'undefined') defaultData[name] = defaultData[name].toString();
                var value = defaultData[name] || schemaObj['default'] || '';

                className = (schemaObj.required ? ' ssi-required' : '');
                if (schemaObj.type == 'array') {
                    className += ' ssi-arrayInput';
                } else if (schemaObj.type == 'object') {
                    className += ' ssi-objectInput';
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                }
                var inputOptions = {
                    name: name,
                    id: name,
                    value: value,
                    className: 'ssi-inputField' + className,
                    type: schemaObj.inputType || formTypes[schemaObj.type]
                };
                var inputType = inputOptions.type;
                if (schemaObj.type == 'date' && schemaObj.default == 'now') {
                    inputOptions.value = Ss_input.tools.getDate();
                } else if (inputType == 'select' && schemaObj.type == 'boolean') {
                    inputOptions.options = [{label: 'true', value: 'true'}, {label: 'false', value: 'false'}];
                } else if (inputType == 'select') {
                    if (schemaObj.options) {
                        var selectOptions = [];
                        for (var i = 0, length = schemaObj.options.length; i < length; i++) {
                            var optionValue = schemaObj.options[i];
                            selectOptions.push({label: optionValue, value: optionValue})
                        }
                        if (schemaObj.multiple)
                            inputOptions.multiple = schemaObj.multiple;
                        inputOptions.options = selectOptions;
                    } else {
                        inputOptions.type = 'text';
                    }
                }
                if (inputType == 'text' && value.length > 100) {
                    inputOptions.type = 'textarea';
                }
                formItem += Ss_input.tools.template(this.template.formItem, {
                    label: this.translate(name, this.options.translateFields),
                    labelClass: className,
                    inputId: name,
                    input: new Ss_input.Input(inputOptions)[0].outerHTML
                });
            }
            return Ss_input.tools.template(this.template.form, {formItem: formItem});
        },
        resetForm: function () {
            $('#ssi-formData').replaceWith(this.getForm());
        },
        getFormData: function () {
            var data = {}, thisS = this, errors = 0;
            $('.ssi-formWindow' + this.ssi.uniqueId).find('#ssi-formData').find('.ssi-inputField').each(function () {
                var $this = $(this);
                if (thisS.checkRequiredFields($this))
                    errors++;
                var val = $this.val();
                if (!val && !thisS.options.sendNullValues)return true;
                if ($this.hasClass('ssi-arrayInput')) {
                    val = val.split(',');
                } else if ($this.hasClass('ssi-objectInput')) {
                    val = JSON.parse(val);
                }
                data[$this.attr('name')] = val;
            });
            return !errors ? data : false;
        },
        checkRequiredFields: function ($input) {
            var val;
            try {
                val = $input.val().replace(/ /g, '');
            } catch (err) {
                val = $input.val();
            }
            if ($input.hasClass('ssi-required') && !val) {
                $input.addClass('ssi-requiredError');
                $input.off('focus.ssi');
                $input.one('focus.ssi', function () {
                    $input.removeClass('ssi-requiredError');
                });
                return true;
            }
            return false;
        },
        createWindow: function (options, topButtons) {
            var contentButtons = this.ssi.addButton(topButtons, 'menuButton');
            options = $.extend({}, {
                content: '',
                onShow: function (modal) {
                    modal.get$content().find('#ssi-topButtons').append(contentButtons);
                },
                buttons: [],
                className: 'ssi-formWindow ssi-formWindow' + this.ssi.uniqueId,
                sizeClass: 'auto'
            }, options);

            options.content = this.template.topBar + options.content;
            options.buttons.push({
                label: this.translate('cancel'),
                className: 'ssi-mBtn ssi-cancel',
                closeAfter: true
            });
            this.ssi.createWindow(options);
        }
    });
})(jQuery);
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

(function ($) {
    Ss_input.fileSystem['mkdir'] = Ss_input.Plugin.extend(
     {
         "permissions": 'write',
         defaults: {
             data: {},
             ajaxOptions: {}
         },
         init: function () {
             this.setButtons();
         },
         setButtons: function () {
             var ssi = this.ssi, thisS = this;
             ssi.addButton({
                 label: '<div class="icon ssi-mkdirIcon"></div>',
                 title: this.translate('createFolder'),
                 id: '',
                 keyPress: {
                     keyCode: '76',
                     ctrl: true,
                     shift: true
                 },
                 input: {
                     enterKey: true,
                     containerClass: 'ssi-foldercont',
                     className: 'ssi-folderInput ssi-menuInput',
                     placeholder: this.translate('name'),
                     id: 'ssi-nameFolder',
                     buttons: [{
                         label: '<div class="icon ssi-checkIcon"></div>',
                         className: 'ssi-inBtn ssi-inFolderBtn',
                         method: function () {
                             thisS.mkdir(ssi.$content.find('#ssi-nameFolder').val());
                         }
                     }]
                 },
                 className: 'ssi-folderSwitch'
             }, 'menuButton', ['menu']);
         },
         mkdir: function (name) {
             var ssi = this.ssi, thisS = this;
             var fileSystem = ssi.fileSystem;

             name = (name || ssi.$content.find('#ssi-nameFolder').val()).replace(/[\[\]/#<$+%>!`&*'|{?"=}\/:\\@\{]/g, '');
             if (name && !ssi.readOnlyMode) {
                 var href = ssi.fileSystem.getPath(name);
                 if (ssi.getItemData('name', name)) {
                     ssi.notify('error', this.translate('folderExistError').replaceText(name));
                     return;
                 }
                 var callback = function () {
                     ssi.notify('success', thisS.translate('successCreated'));
                     var item = {
                         'name': name,
                         'mimeType': 'directory',
                         'date': Ss_input.tools.getDate(),
                         'path': fileSystem.getPath(name),
                         'size': 0,
                         'type': 'zzzzfolder'
                     };
                     ssi.plugins['scan'].appendItems(item);
                     var sideBar = ssi.plugins['sidebar'];
                     if (sideBar)
                         sideBar.addTree({
                             name: name,
                             url: href
                         }, fileSystem.options.rootPath + ssi.currentCollection.id);
                     ssi.$content.find('#ssi-nameFolder').val('');
                     ssi.$content.find('.ssi-foldercont').hide(500);
                     ssi.$element.trigger('resetAction.ssi');
                 };
                 var data = $.extend({}, this.options.data, {
                     'dirname': name,
                     currentDir: fileSystem.options.rootPath + ssi.currentCollection.id
                 });
                 var ajaxOptions = $.extend({}, {
                     data: data,
                     url: fileSystem.options.scriptsPath + '/mkdirAction.php'
                 }, this.options.ajaxOptions);
                 ssi.ajaxCall(ajaxOptions, callback);
             }
         }
     })
})(jQuery);
(function ($) {
    Ss_input.fileSystem['newFile'] = Ss_input.Plugin.extend({
        permissions:'write',
        defaults: {
            ajaxOptions: {},
            data: {},
            theme: 'monokai',
            language: 'javascript',
            onShow: function () {
            }
        },
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            ssi.addButton({
                label: '<div class="icon ssi-newFileIcon"></div>',
                title: this.translate('newFile'),
                id: '',
                input: {
                    enterKey: true,
                    containerClass: 'ssi-newFileContainer',
                    className: 'ssi-FileInput ssi-menuInput',
                    placeholder: this.translate('name'),
                    id: 'ssi-fileName',
                    buttons: [{
                        label: '<div class="icon ssi-checkIcon"></div>',
                        className: 'ssi-inBtn ssi-inFolderBtn',
                        method: function (e, value) {
                            thisS.newFile(value);
                        }
                    }]
                },
                className: 'ssi-folderSwitch'
            }, 'menuButton', ['menu']);
            return this;
        },
        newFile: function (name) {
            var ssi = this.ssi, thisS = this;
            if (!name||ssi.readOnlyMode)return;
            var fileSystem=ssi.fileSystem;
            var item = ssi.getItemData('name', name);
            if (item && item.mimeType != 'directory') {
                ssi.notify('error', this.translate('existError'));

                return;
            }
            var ext=Ss_input.tools.getExtension(name);
            if ($.inArray(ext,ssi.fileSystem.options.allowed)==-1) {
                ssi.notify('error', this.translate('extError').replaceText(ext));
                return;
            }
            var callback = function () {
                ssi.notify('success', thisS.translate('fileSuccessCreated'));
                ssi.$content.find('#ssi-fileName').val('');
                ssi.$content.find('.ssi-newFileContainer').hide(500);
                var item = {
                    'name': name,
                    'mimeType': 'text/plain',
                    'date': Ss_input.tools.getDate(),
                    'path': fileSystem.getPath(name),
                    'size': 1+' B',
                    'type': Ss_input.tools.getExtension(name)
                };
                ssi.plugins['scan'].appendItems(item);
            };
            this.sendRequest(fileSystem.getPath(name),callback);
            return this;
        },
        sendRequest: function (path,callback) {
            var ssi = this.ssi;
            var data = $.extend({}, this.options.data, {
                filePath: path,
                fileContent: ' '
            });
            var ajaxOptions = $.extend({}, {
                data: data,
                url: ssi.fileSystem.options.scriptsPath + 'newFileAction.php'
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, callback);
            return this;
        },
        da: function () {
            /*
             var a = $('<div id="ssi-aceEditor">function foo(items) { var x = "All this is syntax highlighted";return x;}</div>');
             modal.setContent(a);
             var editor = ace.edit("ssi-aceEditor");
             editor.setTheme("ace/theme/" + thisS.options.theme);
             editor.getSession().setMode("ace/mode/" + thisS.options.language);
             editor.resize();
             if (typeof thisS.options.onShow === 'function')
             thisS.options.onShow(editor)*/
        }
    });
})(jQuery);
(function ($) {
    Ss_input.fileSystem['upload'] = Ss_input.Plugin.extend({
        permissions: 'write',
        externalResources: ['$().ssi_uploader()'],
        defaults: {
            data: {},
            uploadOptions: {},
            modalOptions: {}
        },
        init: function () {
            this.setModal();
            this.setUploader();
            this.setButtons();
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<div class="icon ssi-uploadIcon"></div>',
                title: this.translate('upload'),
                id: 'ssi-uploadBtn',
                keyCode: '',
                className: 'ssi-folderSwitch',
                method: function () {
                    thisS.uploadFiles();
                }
            }, 'menuButton', ['menu']);
        },
        setModal: function () {
            var ssi = this.ssi, thisS = this;
            this.modalOptions = $.extend({}, {
                sizeClass: 'mediumToLarge',
                content: '<input type="file" multiple id="ssi-upload" />',
                title: this.translate('uploadFiles'),
                className: "ssi-uploadModal",
                keepContent: true
            }, this.options.modalOptions);
            this.modalOptions.onShow = function (modal) {
                thisS.ssi.$element.trigger('uploadShowAction.ssi');
                var $upload = modal.get$content().find('#ssi-upload').data('ssi_upload');
                if ($upload) {
                    $upload.options.data.currentDir = ssi.fileSystem.options.rootPath + ssi.currentCollection.id;
                }
                if (typeof thisS.options.modalOptions.onShow === 'function')
                    thisS.options.modalOptions.onShow(modal);
            };
            this.modalOptions.onClose = function (modal) {
                if (typeof thisS.options.modalOptions.onClose === 'function')
                    thisS.options.modalOptions.onClose(modal);
                thisS.ssi.$element.trigger('uploadCloseAction.ssi');
            }

        },
        setUploader: function () {
            var ssi = this.ssi, thisS = this;
            this.uploaderOptions = $.extend({}, {
                url: ssi.fileSystem.options.scriptsPath + '/uploadAction.php',
                locale: ssi.options.language,
                responseValidation: ssi.fileSystem.options.responseValidation,
                dropZone: true,
                multiple: true,
                preview: true,
                errorHandler: {
                    method: function (msg, type) {
                        ssi.notify(type, msg)
                    }, success: 'success', error: 'error'
                },
                beforeEachUpload: function (imgInfo, xhr) {
                    if (ssi.getItemData('name', imgInfo.name)) {
                        xhr.abort();
                        return thisS.translate('existError');
                    }
                },
                onEachUpload: function (fileInfo) {
                    thisS.onEachUpload(fileInfo)
                },
                maxFileSize: 3,
                allowed: ssi.fileSystem.options.allowed
            }, this.options.uploadOptions);
        },
        onEachUpload: function (fileInfo) {

        },
        uploadFiles: function () {
            var ssi = this.ssi;
            if (ssi.readOnlyMode)return;
            var modal = ssi.createWindow(this.modalOptions, '#ssi-uploadBtn');
            this.uploaderOptions.data = $.extend({}, {currentDir: ssi.fileSystem.options.rootPath + ssi.currentCollection.id}, this.options.data);
            modal.get$content().find('#ssi-upload').ssi_uploader(this.uploaderOptions);
        }
    })
})(jQuery);

(function ($) {
    Ss_input.fileSystem['url'] = Ss_input.Plugin.extend({
        defaults: {
            ajaxOptions: {},
            data: {}
        },
        init: function () {
            if (this.ssi.options.mode != 'selection')
                return;
            this.setButtons();

        },
        setButtons: function () {

            var ssi = this.ssi, thisS = this;
            var inputButtons = [{
                label: '<div class="icon ssi-checkIcon"></div>',
                className: 'ssi-inBtn ssi-inUrlBtn',
                method: function () {
                    thisS.addUrl();
                }
            }];
            ssi.addButton({
                label: '<div class="icon ssi-urlIcon"></div>',
                title: this.translate('addUrl'),
                id: '',
                keyCode: '',
                input: {
                    enterKey: true,
                    containerClass: 'ssi-urlcont',
                    className: 'ssi-urlInput ssi-menuInput',
                    placeholder: this.translate('url'),
                    id: 'ssi-url',
                    tooltip: this.translate('uploadImg'),
                    buttons: inputButtons
                },
                className: 'ssi-urlSwitch'
            }, 'menuButton', ['menu']);

        },
        addUrl: function () {
            var ssi = this.ssi;
            var url = ssi.$content.find('#ssi-url').val();
            if (url != '') {
                var thisS = this;
                var test = this.testUrl(url);
                if (!test)return;
                var callback = function () {
                    console.log()
                    if (ssi.corePlugins.selection.options.selectionMode === 'multiSelection') {
                        ssi.notify('success', thisS.translate('addSuccess'));
                    }
                    ssi.corePlugins['selection'].selectItem(url, '', true);
                };
                this.IsValidImageUrl(url, callback);
            }
        },
        testUrl: function (url) {
            var dataUri = false, image = false, ext, thisS = this, ssi = this.ssi, msg;
            if (/^(http|https|ftp):\/\/[a-z0-9]+([\-\.][a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)+\.[a-z0-9]+$/i.test(url)) {
                ext = Ss_input.tools.getExtension(url);
                image = true
            }
            if (!image) {
                if (isDataURL(url)) {
                    dataUri = true;
                    var regex = new RegExp(/^(data:)([\w\/\+]+);(charset=[\w-]+|base64).*,(.*)/gi);
                    ext = regex.exec(url)[2].split('/')[1]
                }

            }
            if (!image && !dataUri) {
                ssi.notify('error', thisS.translate('invalidUrlError'));
                return false;
            }
            if ($.inArray(ext, ssi.fileSystem.options.allowed) < 0 && !dataUri) {
                ssi.notify('error', thisS.translate('extError').replaceText(ext));
                return false;
            }
            return (dataUri ? 'dataUrl' : true);
        },
        IsValidImageUrl: function (url, callback) {
            var thisS = this, ssi = this.ssi;
            $("<img>", {
                src: url,
                error: function () {
                    ssi.notify('error', thisS.translate('invalidUrlError'));
                },
                load: function () {
                    callback();
                }
            });
        }
    });
    function isDataURL(s) {
        return !!s.match(isDataURL.regex);
    }

    isDataURL.regex = /^\s*data:([a-z]+\/[a-z0-9\-\+]+(;[a-z\-]+\=[a-z0-9\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
})(jQuery);
(function ($) {
    Ss_input.database['newRecord'] = Ss_input.Plugin.extend({
        permissions: 'write',
        defaults: {
            ajaxOptions: {
                stringifyData: true,
                contentType: "application/json"
            },
            data: {}
        },
        init: function () {
            this.database = this.ssi.corePlugins['database'];
            this.setButtons();
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<div class="icon ssi-newDocumentIcon"></div>',
                title: this.translate('newDocument'),
                method: function () {
                    thisS.addNew();
                }
            }, 'menuButton', ['menu']);
        },
        addNew: function () {
            var ssi = this.ssi, thisS = this;
            var content = this.database.getForm();
            var topButtons = [{
                title: this.translate('saveAndNew'),
                label: '<div class="icon ssi-saveIcon"></div>+',
                method: function () {
                    thisS.save(function (data, textStatus, xhr) {
                        if (xhr.status == 201) {
                            thisS.database.resetForm();
                            ssi.notify('success', thisS.translate('successSave'))
                        }
                    });
                }
            }];
            var modalOptions = {
                content: content,
                buttons: [{
                    label: '<div class="icon ssi-saveIcon"></div>&nbsp;' + this.translate('save'),
                    closeAfter: false,
                    className: 'ssi-mBtn',
                    method: function (e, modal) {
                        thisS.save(function (data, textStatus, xhr) {
                            if (xhr.status == 201 || xhr.status == 200) {
                                if (modal)
                                    modal.close();
                                ssi.notify('success', thisS.translate('successSave'))
                            }
                        });
                    }
                }]
            };
            this.database.createWindow(modalOptions, topButtons);
        },
        save: function (callback) {
            var formData = this.database.getFormData();
            if (!formData)return;
            var ssi = this.ssi,thisS=this;
            var data = $.extend({}, this.options.data, formData);
            var ajaxOptions = $.extend({}, {
                data: data,
                url: this.database.currentCollection.baseUrl.replace('/:id', '')
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, function (data, textStatus, xhr) {
                if (xhr.status == 201 || xhr.status == 200) {
                    ssi.plugins['scan'].appendItems((typeof data === 'object'&&data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                }
                if (typeof callback === 'function') {
                    callback(data, textStatus, xhr, formData)
                }
            });
            return this;
        }
    })
})(jQuery);
(function () {
    Ss_input.plugins['refresh'] = Ss_input.Plugin.extend({
         init: function () {
             var ssi = this.ssi;
             var thisS = this;
             ssi.addButton({
                 label: '<div class="icon ssi-refreshIcon"></div>',
                 title: this.translate('refresh'),
                 id: 'ssi-refresh',
                 keyCode: 'r',
                 className: 'ssi-urlSwitch',
                 method: function () {
                     thisS.refresh(ssi.currentCollection.id);
                 }
             }, 'menuButton', ['menu'])
         },
         refresh: function () {
             if (this.ssi.readOnlyMode)return;
             var ssi = this.ssi;
             var cache = ssi.plugins['cache'];
             if (cache) {
                 cache.removeCachedPage(ssi.currentCollection.id)
             }
             ssi.$element.trigger('resetAction.ssi');
             ssi.plugins['scan'].scanCollection(ssi.currentCollection.id,ssi.currentCollection.url,ssi.currentCollection.data);
         }
     }
    )
})();
(function ($) {
    Ss_input.plugins['imgBox'] = Ss_input.Plugin.extend({
        defaults: {
            excludeItems: '',
            imageField: ''

        }, init: function () {
            this.setEvents();
        }, setEvents: function () {
            var Button = this.getButton('', 'contentImages'+this.ssi.uniqueId);
            var thisS = this;
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                if (thisS.options.imageField && item.data[thisS.options.imageField] && (!thisS.options.excludeItems || eval(Ss_input.tools.dataReplace(thisS.options.excludeItems, "item.data")) == 'false')) {
                    item.$element.find('div.ssi-optionsDiv').append(Button.clone(true).attr('href', item.data[thisS.options.imageField]));
                }
            }).on('changeSchemaAction.ssi', function (e, data) {
                if (data['displayImage'] && data['displayImage'].indexOf('field:(') > -1&& data['displayImage'].indexOf('condition:(') == -1)
                    thisS.options.imageField = data['displayImage'].replace(/field:\((.*)\)/, '$1');
            });
        },
        getButton: function (href, group) {
            return this.ssi.addButton({
                label: '<div class="icon ssi-imgBoxIcon"></div>',
                id: '',
                stopPropagation: false,
                className: 'ssi-imgBox',
                attributes: {'data-ssi_imgGroup': group, href: href}
            }, 'itemButton', false);
        }
    })
})(jQuery);
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
(function ($) {
    Ss_input.plugins['templateManager'] = Ss_input.Plugin.extend({
        template: {
            details: {
                wrapper: '<table id="ssi-itemsWrapper" class="ssi-details"><thead><tr class="header"><th></th><#=header#><th></th></tr></thead></table>',
                item: '<tbody class="ssi-itemWrapper <#= previewClass #>"><tr class="ssi-selectable ssi-mainElement" data-ID="<#= id #>"><td><div style=\'background-image:url("<#=displayImage#>");\'" class="ssi-displayDiv"></td><#=items#><td><div class="ssi-optionsDiv"></div></td></tr></tbody>',
                header: '<th><#=name#></th>'
            },
            icons: {
                wrapper: '<div id="ssi-itemsWrapper" class="ssi-icons"></div>',
                item: '<table class="ssi-itemWrapper <#= previewClass #>"><tr><td><div style=\'background-image:url("<#=displayImage#>");\' data-ID="<#= id #>" class="ssi-mainElement ssi-selectable ssi-displayDiv"><div class="ssi-optionsDiv"></div></div></td></tr><tr><td><div class="ssi-itemName"><#= displayName||"" #></div></td></tr></table>'
            }
        }, defaults: {
            template: 'icons',
            excludeFields: [],
            limit: 3,
            translateFields: ''
        },
        init: function () {
            this.options.translateFields = this.options.translateFields || this.ssi.options.translateFields;
            this.headerArray = [];
            this.header = '';
            this.setEvents()
             .setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-previewIcon"></span> ' + this.translate('previewType'),
                id: '',
                className: '',
                subMenu: [{
                    label: '<span class="icon ssi-detailsPreviewIcon"></span> ' + this.translate('details'),
                    method: function () {
                        if (thisS.options.template != 'details') {
                            thisS.options.template = 'details';
                            thisS.scan.reEchoItems();
                        }
                    }
                }, {
                    label: '<span class="icon ssi-iconsPreviewIcon"></span> ' + this.translate('icons'),
                    method: function () {
                        if (thisS.options.template != 'icons') {
                            thisS.options.template = 'icons';
                            thisS.scan.reEchoItems();
                        }
                    }
                }]
            }, 'listButton', ['options']);
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            ssi.$element.on('beforeEchoItemsAction.ssi', function (e, page) {
                 thisS.scan.selectedTemplate = $.extend({}, thisS.template[thisS.options.template]);
                 thisS.setTemplate(page.data);
             })
             .on('appendItemSetAction.ssi', function () {
                 if (!thisS.header && thisS.options.template == 'details') {
                     thisS.scan.reEchoItems();
                 }
             })
             .on('changeSchemaAction.ssi', function (e, data) {
                 thisS.header = '';
                 thisS.headerArray = [];
                 thisS.options.excludeFields = data['details'];
             });
            return this;
        },
        setTemplate: function (data) {
            if (this.options.template == 'details') {
                this.setHeader(data[0]);
            }
        },
        setHeader: function (data) {
            var index = 0;
            if (!this.header) {
                for (var fieldName in data) {
                    if ($.inArray(fieldName, this.options.excludeFields) > -1)continue;
                    this.headerArray.push(fieldName);
                    this.header += Ss_input.tools.template(this.template.details.header, {name: this.translate(fieldName, this.options.translateFields)});
                    index++;
                    if (index == this.options.limit)break;
                }
            }
            this.scan.selectedTemplate.wrapper = Ss_input.tools.template(this.template.details.wrapper, {header: this.header});
        },
        getTemplate: function (data, displayName, displayImage, template) {
            var scanOptions = this.scan.options,
             fieldData,
             previewClass = eval(Ss_input.tools.dataReplace(scanOptions.itemClass)),
             fieldTemplate = '', id = data[scanOptions.idField];
            if (typeof id === 'object') {
                id = data[scanOptions.idField] = id[Ss_input.tools.getFirstKey(id)]
            }
            template = template || this.options.template;
            displayName = displayName || data[scanOptions.titleField] || id;
            displayImage = displayImage || '';
            if (template == 'details') {
                for (var i = 0, length = this.headerArray.length; i < length; i++) {
                    if (typeof data[this.headerArray[i]] === 'object' && !(data[this.headerArray[i]] instanceof Array)) {
                        fieldData = data[this.headerArray[i]] = JSON.stringify(data[this.headerArray[i]]);
                    } else {
                        fieldData = Ss_input.tools.escapeHtml(data[this.headerArray[i]]);
                    }
                    if (fieldData.length > 200 || fieldData.split(' ').length > 30) {
                        fieldData = '<div class="ssi-longText">' + fieldData + '</div>';
                    }
                    fieldTemplate += '<td' + (this.headerArray[i] == scanOptions.titleField ? ' class="ssi-itemName"' : '') + '>' + fieldData + '</td>';
                }
            }
            var dataOptions = {
                id: id,
                displayName: Ss_input.tools.escapeHtml(displayName),
                previewClass: previewClass,
                displayImage: displayImage,
                items: fieldTemplate
            };
            return Ss_input.tools.template(this.template[template].item, dataOptions);
        }
    })
})(jQuery);


(function ($) {
    Ss_input.plugins['iconSize'] = Ss_input.Plugin.extend({
        defaults: {
            defaultSize: 'small'
        },
        init: function () {
            this.sizeClass = {
                'large': 'ssi-mImgL',
                'medium': '',
                small: 'ssi-mImgS'
            };
            this.setButtons()
             .setEvents();
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-sizeIcon"></span> ' + this.translate('iconSize'),
                id: '',
                className: '',
                subMenu: [{
                    label: '<span class="ssi-letterIcon">S</span> ' + this.translate('small'),
                    method: function () {
                        thisS.options.defaultSize = 'small';
                        thisS.setIcons();
                    }
                }, {
                    label: '<span class="ssi-letterIcon">M</span> ' + this.translate('medium'),
                    method: function () {
                        thisS.options.defaultSize = 'medium';
                        thisS.setIcons();
                    }
                }, {
                    label: '<span class="ssi-letterIcon">L</span> ' + this.translate('large'),
                    method: function () {
                        thisS.options.defaultSize = 'large';
                        thisS.setIcons();
                    }
                }]
            }, 'listButton', ['options']);
            return this;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                item.$element.addClass(thisS.sizeClass[thisS.options.defaultSize])
            });
            return this;
        },
        setIcons: function (size) {
            size = size || this.options.defaultSize;
            this.ssi.$content.find('.ssi-itemWrapper').removeClass('ssi-mImgL ssi-mImgS').addClass(this.sizeClass[size]);
            return this;
        }

    })
})(jQuery);

/*





 */
(function ($) {
    Ss_input.plugins['sort'] = Ss_input.Plugin.extend({
        defaults: {
            sortType: 'asc',
            sortBy: '',
            sortableFields: [],
            translateFields: ''
        },
        template: {
            reverse: '<a id="ssi-reverse" href="#" class="ssi-reverse"><span class="icon ssi-reverseIcon"></span></a>'
        },
        init: function () {
            var ssi = this.ssi,
             thisS = this;
            this.options.translateFields = this.options.translateFields || ssi.options.translateFields;
            ssi.$element.on('changeSchemaAction.ssi', function (e, data) {
                thisS.options.sortableFields = data['sort'];
                thisS.options.sortBy= data['sort'][0];
                thisS.resetUi();
            });
            if (this.options.sortableFields.length == 0)return;
            this.options.sortBy = this.options.sortBy || this.options.sortableFields[0];
            this.setButtons()
             .setEvents();
        },
        setEvents: function () {
            var thisS = this, ssi = this.ssi;

            this.ssi.$element.on('beforeEchoItemsAction.ssi', function (e, page) {
                thisS.sort(page.data);
            })

        },
        setButtons: function (appendTo) {
            var ssi = this.ssi,
             thisS = this,
             buttons = [];
            $(this.template.reverse).appendTo(ssi.$content.find('#ssi-topBarWrapper')).on('click.ssi', function () {
                if (thisS.options.sortType === 'asc') {
                    thisS.options.sortType = 'desc';
                } else {
                    thisS.options.sortType = 'asc';
                }
                ssi.plugins['scan'].reEchoItems();
                return false;
            });
            for (var i = 0, length = this.options.sortableFields.length; i < length; i++) {
                var field = this.options.sortableFields[i];
                buttons.push({
                    label: '<span class="ssi-letterIcon">' + field[0].toUpperCase() + '</span> ' + this.translate(field, this.options.translateFields),
                    attributes: {'data-ssi_title': field},
                    method: function () {
                        thisS.options.sortBy = $(this).attr('data-ssi_title');
                        ssi.plugins['scan'].echoFiles({
                            id: ssi.currentCollection.id,
                            data: ssi.getPageData()
                        });
                    }
                })
            }
            if(buttons.length<2)return this;
            this.ssi.addButton({
                label: '<span class="icon ssi-sortIcon"></span> ' + this.translate('sort'),
                id: 'ssi-sortButton',
                className: '',
                subMenu: buttons
            }, 'listButton', appendTo || ['options']);
            return this;
        },
        resetUi: function () {
            var sortButton = this.ssi.$content.find('#ssi-sortButton').remove();
            this.ssi.$content.find('#ssi-reverse').remove();
            if (!this.options.sortableFields.length)return;
            this.options.sortBy = this.options.sortBy || this.options.sortableFields[0];
            this.setButtons(this.ssi.$content.find('#ssi-TasksBtn').next());
            if (!sortButton.length) {
                this.setEvents();
            }
        },
        sort: function (data) {
            try {
                var thisS = this, ssi_sortBy = this.options.sortBy,
                 ssi_sortType = this.options.sortType;
                if(!ssi_sortType)return;
                data.sort(function (a, b) {
                    var o1, o2;
                    if (new RegExp("(?:[a-z]*(?:_date|date_|Date|-date|date-)[a-z]*)|^(?:date)(?:$|[A-Z]+.*)").test(ssi_sortBy)) {
                        o1 = Ss_input.tools.parseDate(a[ssi_sortBy]);
                        o2 = Ss_input.tools.parseDate(b[ssi_sortBy]);
                    }  else {
                        o1 = a[ssi_sortBy];
                        o2 = b[ssi_sortBy];
                    }
                    if (ssi_sortType === 'desc') {
                        var o3 = o1;
                        o1 = o2;
                        o2 = o3;
                    }
                    if (ssi_sortBy !== thisS.options.sortableFields[0]) {
                        var p1 = a[thisS.options.sortableFields[0]];
                        var p2 = b[thisS.options.sortableFields[0]];
                    }
                    if (o1 < o2) return -1;
                    if (o1 > o2) return 1;
                    if (p1 < p2) return -1;
                    if (p1 > p2) return 1;
                });
            } catch (e) {
                }
        }
    })
})(jQuery);

/*





 */
(function ($) {
    Ss_input.plugins['info'] = Ss_input.Plugin.extend({
        template: {
            table: '<table class = "ssi-infoTable ssi-infoCompare"><#=rows#></table>',
            item: '<td><#=fieldData#></td>',
            row: '<tr><th><#=header#></th><#=items#></tr>'
        },
        defaults: {
            excludeItems: '',
            excludeFields: [],
            translateFields:''
        },
        init: function () {
            this.options.translateFields = this.options.translateFields || this.ssi.options.translateFields;
            this.$content = '';
           this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-infoIcon"></span>' + this.translate('info') + '<span class="ssi-keyShort">ctrl + i</span>',
                id: '',
                keyPress: {
                    keyCode: '73',
                    ctrl: true,
                },
                className: 'ssi-detailsButton',
                method: function () {
                    thisS.getFilesInfo();
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu', 'actions']);

        },
        handleData: function (data) {
        },
        getTemplate: function (data) {
            var itemsLength = 0,
             realLength = data.length;
            var items, rows = '',dataField;
            for (var dataName in data[0]) {
                if (this.options.excludeFields.length && $.inArray(dataName, this.options.excludeItems) == -1)
                    continue;
                var length = realLength;
                if (length > 6)length = 6;
                items = '';
                for (var i = 0; i < length; i++) {
                    if (this.options.excludeItems && eval(Ss_input.tools.dataReplace(this.options.excludeItems, "data[i]")) != "false") {
                        if (realLength > length)length++;
                        continue;
                    }
                    if(dataName=='preview'){
                        dataField=data[i][dataName];
                    }else{
                        dataField=Ss_input.tools.escapeHtml(data[i][dataName]);
                        if(dataField.split(' ').length>5){
                            dataField='<div class="ssi-longText">'+dataField+'</div>'
                        }
                    }
                    items += Ss_input.tools.template(this.template.item, {fieldData: dataField});
                    itemsLength++;
                }
                rows += Ss_input.tools.template(this.template.row, {
                    header: this.translate(dataName, this.options.translateFields),
                    items: items
                });
                if (itemsLength == 0)return false;
            }
            return Ss_input.tools.template(this.template.table, {rows: rows});
        },
        getFilesInfo: function () {
            var ssi = this.ssi,
             dataList = ssi.getSelectedData();
            if (!dataList.length) {
                return;
            }
            this.handleData(dataList);
            var details = this.getTemplate(dataList);
            if (details) {
                var $details = $(details);
                ssi.createWindow({
                    title: this.translate('details'),
                    sizeClass: 'auto',
                    className: "ssi-infoModal",
                    outSideClose: false,
                    content: $details,
                    buttons: {
                        className: 'ssi-mBtn',
                        label: this.translate('ok'),
                        closeAfter: true
                    },
                    onClose: function () {
                        ssi.$element.trigger('infoCloseAction.ssi')
                    }, onShow: function () {
                        ssi.$element.trigger('infoShowAction.ssi', [$details]);
                    }
                }).get$content();
            }
        }
    })
})(jQuery);

(function ($) {
    var ssi_cutItem = [], ssi_copyItem = [], ssi_totalProgress = [];
    Ss_input.fileSystem['copy'] = Ss_input.Plugin.extend({
        permissions: 'write',
        defaults: {
            copy: {
                data: {},
                ajaxOptions: {}
            },
            cut: {
                data: {},
                ajaxOptions: {}
            }
        },
        init: function () {
            this.setEvents()
             .setButtons();
        },
        setEvents: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.$element.on('resetAction.ssi', function () {
                ssi_cutItem = [];
                ssi_copyItem = [];
                ssi_totalProgress = [];
                ssi.$content.find('.ssi-pasteButton').addClass('disabled');
            }).on('echoItemsAction.ssi', function () {
                 thisS.setCut();
                 if (ssi_cutItem.length > 0 || ssi_copyItem.length > 0) {
                     ssi.$content.find('.ssi-pasteButton').removeClass('disabled');
                 } else {
                     ssi.$content.find('.ssi-pasteButton').addClass('disabled');
                 }
             })
             .on('removeCollectionAction.ssi', function (e, id) {
                 if (ssi_copyItem.length) {
                     Ss_input.tools.removeFromArray(ssi_copyItem, ssi.fileSystem.options.rootPath + id);
                 }
             });
            return this;
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-copyIcon"></span> ' + this.translate('copy') + ' <span class="ssi-keyShort">ctrl + c</span>',
                className: '',
                method: function () {
                    thisS.copy();
                },
                keyPress: {
                    keyCode: '67',
                    ctrl: true
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu', 'actions']);
            if (ssi.checkPermissions(this.permissions, 'cut'))
                ssi.addButton({
                    label: '<span class="icon ssi-cutIcon"></span> ' + this.translate('cut') + ' <span class="ssi-keyShort">ctrl + x</span>',
                    className: '',
                    method: function () {
                        thisS.cut();
                    },
                    keyPress: {
                        keyCode: '88',
                        ctrl: true
                    },
                    selectionRequired: true
                }, 'listButton', ['contextMenu', 'actions']);
            ssi.addButton({
                label: '<span class="icon ssi-pasteIcon"></span> ' + this.translate('paste') + ' <span class="ssi-keyShort">ctrl + v</span>',
                className: 'ssi-pasteButton',
                method: function () {
                    thisS.paste();
                },
                keyPress: {
                    keyCode: '86',
                    ctrl: true
                },
                selectionRequired: false
            }, 'listButton', ['contextMenu', 'options']);
            return this;
        },
        cut: function (url) {
            try {
                var ssi = this.ssi;
                this.cutEffect('remove');
                if (!url) {
                    ssi_cutItem = ssi.getUrlList();
                } else {
                    ssi_cutItem = Ss_input.tools.toArray(url);
                }
                this.toPaste = ssi.getSelectedData();
                this.cutEffect('add');
                ssi_copyItem = [];
                ssi.$content.find('.ssi-pasteButton').removeClass('disabled');
            } catch (e) {
            }
        },
        copy: function (url) {
            var ssi = this.ssi;
            if (!url) {
                ssi_copyItem = ssi.getUrlList();
            } else {
                Ss_input.tools.toArray(url);
            }
            this.toPaste = ssi.getSelectedData();

            if (ssi_cutItem.length > 0) {
                this.cutEffect('remove');
                ssi_cutItem = [];
            }
            ssi.$content.find('.ssi-pasteButton').removeClass('disabled');
        },
        cutEffect: function (action) {
            if (action === 'add') {
                var active = $('.ssi-mActive').addClass('ssi-cutItem');
                if (!active.length) {
                    $(this.ssi.plugins['contextMenu'].rightClickItem).addClass('ssi-cutItem');
                }
            } else {
                $('.ssi-cutItem').removeClass('ssi-cutItem');
            }
        },
        setCut: function () {
            for (var i = 0; i < ssi_cutItem.length; i++) {
                this.ssi.$content.find(".ssi-selectable[data-ID='" + ssi_cutItem[i] + "']").addClass('ssi-cutItem');
            }
        },
        paste: function () {
            var url, extraData, ajaxOptions, urlList, action, middleware = '', ssi = this.ssi, thisS = this;
            var fileSystem = ssi.fileSystem;

            if (ssi_copyItem.length > 0) {
                action = 'copyAction';
                url = fileSystem.options.scriptsPath + '/copyAction.php';
                extraData = this.options.copy.data || {};
                urlList = ssi_copyItem;
                ajaxOptions = this.options.copy.ajaxOptions || {};
            } else if (ssi_cutItem.length > 0) {
                action = 'cutAction';
                url = fileSystem.options.scriptsPath + '/cutAction.php';
                extraData = this.options.cut.data || {};
                urlList = ssi_cutItem;
                ajaxOptions = this.options.cut.ajaxOptions || {};
                this.cutEffect('remove');
                ssi_cutItem = [];
            } else {
                return;
            }
            var pageData = ssi.getPageData(), glob_i = 0;
            ajaxOptions = $.extend({}, {
                url: url,
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    xhr.addEventListener("progress", function (e) {
                        if (e.lengthComputable) {
                            var progress = ssi.$content.find('#ssi-progressBar');
                            progress.removeClass('hide');
                            ssi_totalProgress[glob_i] = (e.loaded / e.total) * 100;
                            var sum = Ss_input.tools.arraySum(ssi_totalProgress) / urlList.length;
                            progress.css({
                                width: sum + '%'
                            });
                        }
                    }, false);
                    return xhr;
                }
            }, ajaxOptions);
            sendRequest();
            function ajaxLoop(data, middleware) {
                var newDestination;
                middleware = middleware || '';
                ssi_totalProgress.push(0);
                ajaxOptions.success = function (data) {
                    try {
                     try {
                        data = $.parseJSON(data);
                    } catch (err) {
                        console.log('Probably data is not json formatted.');
                        console.log(data);
                    }

                    if (data.type === 'success') {
                        var fName;
                        if ((data.msg.indexOf('continue') > -1))
                            fName = data.msg.replace(' continue', '');
                        else
                            fName = Ss_input.tools.basename(ajaxOptions.data.newUrl);
                        pasteToDOM(urlList[glob_i], action, middleware, fName);
                        next();
                        if (ssi.checkedItems) {
                            Ss_input.tools.removeFromArray(ssi.checkedItems, urlList[glob_i])
                        }
                    } else if (data.type === 'error') {
                        if (data.msg.indexOf('already_exists') > -1) {
                            newDestination = fileSystem.getPath(Ss_input.tools.basename(urlList[glob_i]));
                            var name = data.msg.replace('already_exists', '');
                            if (name.length > 30) {
                                name = Ss_input.tools.cutFileName(name, '', 28)
                            }
                            bootCall(newDestination, urlList[glob_i], name);
                        } else {
                            throw{
                                type: data.type,
                                msg: data.msg
                            }
                        }
                    } else {
                        throw{
                            type: data.type,
                            msg: data.msg
                        }
                    }
                    } catch (err) {
                     next();
                     if (err.type === 'error') {
                     ssi.notify('error', err.msg);
                     } else {
                     console.log(data);
                     console.log(err.msg);
                     console.log(err.message);
                     }
                     }
                     };
                ajaxOptions.data = data;
                ssi.ajaxCall(ajaxOptions);
            }

            function changeDestination(CopiedCurrent, finalName, destinations) {
                var newName = generateNewName(finalName, CopiedCurrent.type);
                var regexp = new RegExp(Ss_input.tools.escape(finalName) + '$');
                return destinations.replace(regexp, newName)
            }

            function generateNewName(fileName, type, action) {
                var nameArray = [], newName, i;
                for (i = 0; i < pageData.length; i++) {
                    nameArray[i] = pageData[i].name;
                }
                if (action === 'inArray') {
                    return $.inArray(fileName, nameArray) !== -1;
                }
                var ext = '', tempName = fileName;
                if (type !== 'zzzzfolder') {
                    ext = '.' + Ss_input.tools.getExtension(fileName);
                    tempName = fileName.replace(ext, '')
                }
                if ($.inArray(tempName + '-copy' + ext, nameArray) !== -1) {
                    if (type === 'zzzzfolder') {
                        for (i = 1; i < 50; i++) {
                            newName = fileName + '-copy(' + i + ')';
                            if ($.inArray(newName, nameArray) === -1) {
                                fileName = newName;
                                break;
                            }
                        }
                    } else {
                        for (i = 1; i < 50; i++) {
                            newName = fileName.replace(/(.[a-zA-Z]{1,5})$/, '-copy(' + i + ')$1');
                            if ($.inArray(newName, nameArray) === -1) {
                                fileName = newName;
                                break;
                            }
                        }
                    }
                } else {
                    fileName = tempName + '-copy' + ext;
                }
                return fileName;
            }

            function bootCall(newDestination, oldDestination, name, CopiedCurrent) {
                var data = $.extend({},
                 extraData, {
                     'newUrl': newDestination,
                     'oldUrl': oldDestination
                 });
                var createCopyCallback = function () {
                     if (action !== 'cutAction') {
                         newDestination = changeDestination(CopiedCurrent, name, newDestination);
                         data['newUrl'] = newDestination;
                         data['action'] = 'continue';
                         ajaxLoop(data, 'continue');
                     }
                 },
                 replaceCallback = function () {
                     data['action'] = true;
                     ajaxLoop(data, 'replace');
                 },
                 skipCallback = function () {
                     glob_i++;
                     next(urlList[glob_i]);
                 };
                var buttons = [
                    {
                        label: thisS.translate('replace'),
                        closeAfter: true,
                        className: "ssi-mBtn",
                        method: replaceCallback
                    },
                    {
                        label: thisS.translate('skip'),
                        className: "ssi-mBtn",
                        closeAfter: true,
                        method: skipCallback
                    },
                    {
                        label: thisS.translate('cancel'),
                        className: "ssi-mBtn ssi-cancel",
                        closeAfter: true
                    }
                ];
                if (action === 'copyAction') {
                    buttons.splice(0, 0, {
                        label: thisS.translate('createCopy'),
                        closeAfter: true,
                        className: "ssi-mBtn",
                        method: createCopyCallback
                    });
                }
                ssi.createWindow({
                    sizeClass: 'small',
                    className:'ssi-confirmModal',
                    fixedHeight: false,
                    content: thisS.translate('replaceMsg').replaceText(name),
                    buttons: buttons
                });
            }

            function next() {
                glob_i++;
                if (glob_i < urlList.length) {
                    sendRequest();
                } else {
                    ssi.reloadProgressbar();
                    glob_i = 0;
                    if (action == 'cutAction') {
                        ssi.$content.find('.ssi-pasteButton').addClass('disabled');
                        ssi_cutItem = [];
                    }
                }
            }

            function sendRequest() {
                var itemName = Ss_input.tools.basename(urlList[glob_i]);
                var newDestination = fileSystem.getPath(itemName);
                if (action == 'cutAction' && newDestination === urlList[glob_i]) {
                    return;
                }
                var data = $.extend({}, extraData, {
                    'newUrl': newDestination,
                    'oldUrl': urlList[glob_i]
                });

                var CopiedCurrent = (Ss_input.tools.findByKey(thisS.toPaste, 'name', itemName));
                if (newDestination == urlList[glob_i]) {
                    newDestination = changeDestination(CopiedCurrent, itemName, newDestination);
                    data['newUrl'] = newDestination;
                    middleware = 'continue';
                    ajaxLoop(data, middleware);
                } else {
                    if (generateNewName(itemName, CopiedCurrent.type, 'inArray')) {
                        bootCall(newDestination, urlList[glob_i], itemName, CopiedCurrent);
                    } else {
                        ajaxLoop(data, middleware);
                    }
                }
            }
            function pasteToDOM(oldAddress, action, middleware, fileName) {
                var oldName = Ss_input.tools.basename(oldAddress);
                var path = Ss_input.tools.dirname(oldAddress).replace(fileSystem.options.rootPath, '') || '/';
                if (action === 'cutAction' && middleware === 'continue') {
                    return;
                }
                var currentObject = $.extend({}, Ss_input.tools.findByKey(thisS.toPaste, 'name', oldName));

                if (middleware === 'replace') {
                    ssi.$element.trigger('removeItemAction.ssi', currentObject.path);
                    if (currentObject.mimeType === 'directory') {
                        ssi.$element.trigger('removeCollectionAction.ssi', currentObject.path.replace(ssi.fileSystem.rootPath));
                    }
                } else if (middleware === 'continue' && action != 'cutAction') {
                    currentObject.name = fileName;
                }
                currentObject.path = fileSystem.getPath(fileName);
                var sideBar = ssi.plugins['sidebar'];
                var cache = ssi.plugins['cache'];
                if (currentObject.mimeType === 'directory') {
                    var cut = false;
                    if (action === 'cutAction') {
                        cut = true;
                        if (cache && cache.options.cacheLimit > 1) {
                            cache.removeCachedPage(Ss_input.tools.urlUnion(path, fileName))
                        }
                    }
                    if (sideBar)
                        sideBar.copyTree(oldAddress, fileSystem.getPath(fileName), true, cut);
                }
                if (middleware != 'replace')
                    ssi.plugins['scan'].appendItems(currentObject);
                if (action === 'cutAction' && cache && cache.options.cacheLimit > 1) {
                    cache.removeCachedItem('path', oldAddress, path);
                }
            }
        }
    })
})(jQuery);
(function ($) {
    var ssi_totalProgress = [];
    Ss_input.plugins['delete'] = Ss_input.Plugin.extend({
        permissions: 'edit',
        defaults: {
            sendId: 'inForm',
            ajaxOptions: {},
            onDelete: function () {
            },
            data: {}
        },
        init: function () {
            this.setEvents();
            this.setButtons();
            this.baseurl = this.options.ajaxOptions.url;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('resetAction.ssi', function () {
                ssi_totalProgress = [];
            });
            this.ssi.$element.on('changeSchemaAction.ssi', function (e, data) {
                thisS.baseurl = data['url'];
            });
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-deleteIcon"></span> ' + this.translate('delete') + ' <span class="ssi-keyShort">del</span>',
                id: '',
                keyPress: {keyCode: '46'},
                className: '',
                method: function () {
                    thisS.deleteFiles();
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu', 'actions']);
        },
        idInUrl: function (ssi_delItem) {
            for (var i = 0, length = ssi_delItem.length; i < length; i++) {
                if (!ssi_delItem[i]) {
                    console.log('Id is required. Try to refresh the data!');
                    continue;
                }
                this.options.ajaxOptions.url = (this.baseurl.indexOf('/:id') == -1 ? this.baseurl + '/' + ssi_delItem[i] : this.baseurl.replace(':id', ssi_delItem[i]));
                this.sendRequest('', this.deleteCallback(ssi_delItem[i]));
            }
        },
        deleteCallback: function (item) {
            var thisS = this;
            return function (data, textStatus, xhr) {
                if (xhr.status > 200 || 204) {
                    thisS.ssi.plugins['scan'].removeItems(item);
                    thisS.ssi.$element.trigger('resetAction.ssi');
                }
                thisS.ssi.$element.trigger('deleteAction.ssi',item);
                if (typeof thisS.options.onDelete === 'function') {
                    thisS.options.onDelete(data, textStatus, xhr, item)
                }
            };
        },
        sendRequest: function (data, callback) {
            data = data || {};
            data = $.extend({}, this.options.data, data);
            var ajaxOptions = $.extend({},
             {
                 data: data,
                 type: "DELETE",
                 url: ''
             }, this.options.ajaxOptions);
            this.ssi.ajaxCall(ajaxOptions, callback);
        },
        idInForm: function (ssi_delItem) {
            this.sendRequest({
                id: ssi_delItem
            }, this.deleteCallback(ssi_delItem));
        },
        deleteDir: function (ssi_delItem) {
            if (!ssi_delItem.length) {
                return;
            }
            if (this.options.sendId == 'inUrl') {
                this.idInUrl(ssi_delItem);
            } else {
                this.idInForm(ssi_delItem);
            }
        },
        deleteFiles: function () {
            var ssi = this.ssi,
             thisS = this,
             ssi_delItem = ssi.getUrlList();
            if (!ssi_delItem || ssi_delItem.length === 0) {
                return;
            }
            ssi.createWindow({
                sizeClass: 'dialog',
                fixedHeight: false,
                className: "ssi-confirmModal",
                content: this.translate('deleteMsg'),
                buttons: [{
                    label: this.translate('cancel'),
                    className: "ssi-mBtn ssi-cancel",
                    closeAfter: true
                }, {
                    label: this.translate('ok'),
                    className: "ssi-mBtn",
                    closeAfter: true,
                    focused: true,
                    method: function () {
                        thisS.deleteDir(ssi_delItem);
                    }
                }]
            });
        }
    })
})(jQuery);
(function ($) {
    Ss_input.fileSystem['textEditor'] = Ss_input.Plugin.extend({
        defaults: {
            ajaxOptions: {},
            data: {},
            pathField: 'path',
            modalOptions: {
                preview: {
                    icon: true,
                    state: 'normal',
                    hideIcons: true
                }
            },
            readOnly: ''
        },
        init: function () {
            this.modalOptions = {
                className: 'ssi-filePreview',
                fixedHeight: true,
                buttons: [],
                outSideClose: false,
                sizeClass: 'large',
                fitScreen: true
            };
            this.path = '';
            this.setModal();
            this.setButtons()
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-editFileIcon"></span> ' + this.translate('textEditor'),
                id: '',
                className: 'ssi-editFile',
                method: function (e) {
                    thisS.path = thisS.ssi.getSelectedField('path')[0];
                    thisS.openFile(thisS.path);
                },
                selectionRequired: true
            }, 'listButton', ['openWith'], 'condition:(field:(mimeType)=="text/plain")');
        },
        setModal: function () {
            var thisS = this;
            $.extend(this.modalOptions, this.options.modalOptions);
            if (this.ssi.checkPermissions('edit', 'editFiles')) {
                this.modalOptions.buttons.push({
                    label: this.translate('save'),
                    method: function () {
                        thisS.saveFile(thisS.getPath(), thisS.getContent());
                    }
                }, {
                    label: thisS.translate('cancel'),
                    closeAfter: true
                });
            } else {
                this.options.readOnly = this.options.readOnly || true;
            }
        },
        openFile: function (path, done) {
            var thisS = this;
            var callback = function (data) {
                var $textArea = $('<textarea id="ssi-textArea" class="ssi-textArea" ' + (thisS.options.readOnly ? 'readonly' : '') + '>' + data + '</textarea>');
                thisS.createWindow($textArea, Ss_input.tools.basename(path));
                if (typeof done == 'function')
                    done($textArea);
            };
            this.sendRequest(path, '', callback, 'GET')
        },
        saveFile: function (path, content) {
            var thisS = this;
            var callback = function (data) {
                thisS.ssi.notify('success', data)
            };
            this.sendRequest(path, content, callback, 'UPDATE');
            return this;
        },
        createWindow: function (content, title) {
            this.modalOptions.content = content;
            this.modalOptions.title = title;
            this.uniqueId = 'ssi-normalModal' + this.ssi.createWindow(this.modalOptions).numberId;
            return this;
        },
        sendRequest: function (path, content, callback, method) {
            var ssi = this.ssi;
            var data = $.extend({}, this.options.data, {
                filePath: path,
                fileContent: content
            });
            var ajaxOptions = $.extend({}, {
                data: data,
                type: method,
                url: ssi.fileSystem.options.scriptsPath + '/' + 'editFileAction.php'
            }, this.options.ajaxOptions);
            ssi.ajaxCall(ajaxOptions, callback);
            return this;
        },
        getContent: function () {
            return $('#' + this.uniqueId).find('#ssi-textArea').val()
        },
        getPath: function () {
            return this.path;
        }
    });
})(jQuery);
(function ($) {
    Ss_input.fileSystem['aceEditor'] = Ss_input.Plugin.extend({
        externalResources: ['ace', 'ace.require("ace/ext/modelist")'],
        defaults: {
            theme: 'monokai',
            config:function(){}
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-aceEditorIcon"></span> ' + this.translate('aceEditor'),
                id: '',
                className: 'ssi-editFile',
                method: function () {
                    thisS.path=thisS.ssi.getSelectedField('path')[0];
                    thisS.openFile(thisS.path);
                },
                selectionRequired: true
            }, 'listButton', ['openWith','actions'], 'condition:(field:(mimeType)=="text/plain")');
            this.modalOptions.className+=' ssi-aceEditor';
        },
        openFile: function (path, done) {
            var thisS = this;
            var callback = function (data) {
                var $textArea = '<div class="ssi-textArea" id="ssi-aceEditor">' + data + '</div>';
                thisS.createWindow($textArea, Ss_input.tools.basename(path));
                thisS.setEditor(path);
                if (typeof done == 'function')
                    done($textArea);
            };
            this.sendRequest(path, '', callback, 'GET')
        },
        setEditor: function (path) {
            var thisS = this, ssi = this.ssi;
            this.editor = editor = ace.edit("ssi-aceEditor");
            if (this.options.readOnly)
                editor.setReadOnly(true);
            editor.setTheme("ace/theme/" + thisS.options.theme);
            editor.$blockScrolling = 'Infinity';
            var session = editor.session;
            session.setMode(ace.require("ace/ext/modelist").getModeForPath(path).mode);
            editor.resize();
            if(typeof this.options.config==='function'){
                this.options.config(editor);
            }
        },
        getContent: function () {
            return this.editor.getValue();
        },
        getPath: function () {
            return this.path;
        }
    }, 'textEditor',Ss_input.fileSystem);
})(jQuery);

(function ($) {
    Ss_input.fileSystem['rename'] = Ss_input.Plugin.extend({
        permissions: 'edit',
        template: '<div id="ssi-editField" class="ssi-editField"><input type="text" id="ssi-renameInput" value="<#=value#>" /></br><button class="ssi-mBtn" id="ssi-renameConfirm"><#=okLabel#></button><button class="ssi-mBtn ssi-cancel" id="ssi-renameCancel"><#=cancelLabel#></button></div>',
        defaults: {
            ajaxOptions: {},
            data: {}
        },
        init: function () {
            this.setButtons();
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi;
            ssi.$element.on('appendItemAction.ssi', function (e, item) {
            });
            ssi.$content.on('mousedown.ssi', function (e) {
                var docContainer = $('.ssi-itemWrapper');
                var isETarget = docContainer.is(e.target);
                var hasETarget = docContainer.has(e.target).length === 0;
                var hasMultiOpt = $(e.target).hasClass('ssi-selectionRequired');
                if (!isETarget && hasETarget && !hasMultiOpt) {
                    $('.ssi-editField').remove();
                    $('.ssi-itemName').show();
                }
            })
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-renameIcon"></span> ' + this.translate('rename') + ' <span class="ssi-keyShort">F2</span>',
                id: '',
                className: 'ssi-rename',
                keyPress: {
                    keyCode: '113',
                    ctrl: false
                },
                method: function () {
                    thisS.rename();
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu', 'actions']);

        },
        rename: function (url) {
            this.ssi.$content.find('#ssi-renameCancel').trigger('click');
            var ssi = this.ssi, thisS = this;
            var fileSystem = ssi.fileSystem;

            url = url || ssi.getUrlList()[0];
            var $element = ssi.get$mainElementById(url);
            var mainTable = $element.parents('.ssi-itemWrapper');
            var $target = mainTable.find('.ssi-itemName'),
             value = Ss_input.tools.basename(url);
            var $renameInput = $(Ss_input.tools.template(this.template, {
                value: value,
                okLabel: this.translate('ok'),
                cancelLabel: this.translate('cancel')
            }));
            $renameInput.find('#ssi-renameCancel')
             .click(function () {
                 $renameInput.remove();
                 $target.show();
                 return false;
             });
            var $confirmButton = $renameInput.find('#ssi-renameConfirm'),
             $input = $renameInput.find('#ssi-renameInput');
            $target.after($renameInput).hide();
            $input.focus().click(function () {
                return false;
            });
            $confirmButton.click(function () {
                var newName = $input.val().replace(/[\[\]/#<$+%>!`&*'|{?"=}\/:\\@\{]/g, '');
                var newExtension = '';
                if (newName != "" && newName !== value) {
                    if (ssi.getItemData('name', newName)) {
                        ssi.notify('error', thisS.translate('existError').replaceText(newName));
                        return;
                    }
                    var cachedItem = ssi.getItemData('name', value);
                    if (cachedItem.type !== 'zzzzfolder') {
                        newExtension = Ss_input.tools.getExtension(newName);
                        if ($.inArray(newExtension.toLowerCase(), ssi.fileSystem.options.allowed) === -1) {
                            ssi.notify('error', thisS.translate('extError').replaceText(newExtension));
                            return;
                        }
                    }
                    var oldPath = fileSystem.getPath(value),
                     newPath = fileSystem.getPath(newName),
                     callback = function (data) {
                         $element.attr('data-ID', newPath);
                         $target.text(newName);
                         $renameInput.remove();
                         $target.show();
                         var elementInfo=$element.data('info');
                         elementInfo.name=newName;
                         elementInfo.path=Ss_input.tools.urlUnion(ssi.currentCollection.id, newPath);
                         var cache = ssi.plugins['cache'];
                         if (cache) {
                             var historyCache = cache.getCache();
                             cachedItem = cache.getCachedItem('name', value,'',historyCache);
                             if (cachedItem) {
                                 cachedItem.name = newName;
                                 cachedItem.path = elementInfo.path;
                             }
                             cache.setCache(historyCache);
                         }
                         var sideBar = ssi.plugins['sidebar'];
                         if (!oldPath.isFile(ssi.fileSystem.options.allowed) && sideBar) {
                             sideBar.editTreeLink(oldPath, newPath, newName, newPath);
                         }
                     };
                    var data = $.extend({}, thisS.options.data, {
                        'newUrl': newPath,
                        'oldUrl': oldPath
                    });
                    var ajaxOptions = $.extend({}, {
                        data: data,
                        'language': ssi.options.language,
                        url: fileSystem.options.scriptsPath + '/renameAction.php'
                    }, thisS.options.ajaxOptions);
                    ssi.ajaxCall(ajaxOptions, callback);
                }
                return false;
            });
        }
    })
})(jQuery);
(function ($) {
    Ss_input.database['editRecord'] = Ss_input.Plugin.extend({
        permissions: 'edit',
        template: {
            form: '<form id="ssi-formData"><table><#=formItem#></table></form>',
            formItem: '<tr><th><label for="<#=inputId#>" class="<#=labelClass#>"><#=label#></label></th><td><#=input#></td></tr>'
        },
        defaults: {
            sendId: 'inUrl',
            ajaxOptions: {
                stringifyData: true,
                contentType: "application/json"
            },
            data: {}
        },
        init: function () {
            this.database = this.ssi.database;
            this.setButtons();
        },
        setEvents: function () {
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<span class="icon ssi-editDocumentIcon"></span> ' + this.translate('editDocument'),
                id: '',
                className: 'ssi-editFile',
                method: function (e) {
                    thisS.edit(thisS.ssi.getSelectedData()[0]);
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu']);
        },
        edit: function (data) {
            var ssi = this.ssi, thisS = this;
            var content = $(this.database.getForm(data));
            if (this.options.sendId == 'inForm') {
                content.append('<input type="hidden" class="ssi-inputField" name="' + this.database.id + '" value="' + data[this.database.currentCollection.id] + '">');
            }
            if (ssi.checkPermissions('write', 'saveAsNew'))
                var topButtons = [{
                    title: this.translate('saveAsNew'),
                    label: '<div class="icon ssi-saveIcon"></div>+',
                    method: function () {
                        thisS.save(data[thisS.database.currentCollection.id], function (data, textStatus, xhr, formData) {
                            if (xhr.status == 201 || xhr.status == 200) {
                                ssi.plugins['scan'].appendItems((typeof data === 'object' && data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                                ssi.notify('success', thisS.translate('successSave'))
                            }
                        }, {
                            url: thisS.database.currentCollection.baseUrl.replace('/:id', ''),
                            type: 'POST'
                        });
                    }
                }];
            var modalOptions = {
                content: content[0].outerHTML,
                buttons: [{
                    label: '<div class="icon ssi-saveIcon"></div>&nbsp;' + this.translate('save'),
                    closeAfter: false,
                    className: 'ssi-mBtn',
                    method: function (e, modal) {
                        thisS.save(data[thisS.database.currentCollection.id], function (data, textStatus, xhr, formData) {
                            if (xhr.status == 200) {
                                if (modal)
                                    modal.close();
                                ssi.plugins['scan'].resetItem(data[thisS.database.currentCollection.id], (typeof data === 'object' && data.hasOwnProperty(thisS.database.currentCollection.id) ? data : formData));
                                ssi.notify('success', thisS.translate('successSave'));
                            }
                        });
                    }
                }]
            };

            this.database.createWindow(modalOptions, topButtons);
        },
        save: function (id, callback, options) {
            var formData = this.database.getFormData();
            if (!formData)return;
            var ssi = this.ssi, url;
            var data = $.extend({}, this.options.data, formData);
            if (this.options.sendId == 'inUrl') {
                url = (this.database.currentCollection.baseUrl.indexOf('/:id') == -1 ? this.database.currentCollection.baseUrl + '/' + id : this.database.currentCollection.baseUrl.replace(':id', id));
            } else {
                url = this.database.currentCollection.baseurl;
            }
            var ajaxOptions = $.extend({}, {
                data: data,
                type: 'PUT',
                url: url
            }, options, this.options.ajaxOptions);

            ssi.ajaxCall(ajaxOptions, function (data, textStatus, xhr) {
                if (typeof callback === 'function') {
                    callback(data, textStatus, xhr, formData);
                }
            });
            return this;
        }
    })
})(jQuery);
(function ($) {
    Ss_input.plugins['sidebar'] = Ss_input.Plugin.extend({
        template: {
            sideBar: '<div id="ssi-sidebar" class="ssi-sidebar"><div id="ssi-sidebarContent"></div></div>',
            treeItem: '<li id="<#=id#>" class="<#=className#>"><a class="ssi-listAnchor" href="<#=href#>" ><#=name#></a><#=children#></li>',
            hideButton: '<a href="#" id="ssi-hideSideBar"><div class="icon ssi-sideBarIcon"></div></a>',
            dragBar: '<div id="dragbar"></div>'
        },
        defaults: {
            state: 'open',
            data: [],
            fieldDefinition: {
                name: 'name',
                id: 'id',
                url: 'url',
                children: 'children',
                className: 'className'
            },
            className: '',
            resizable: true,
            mode: 'treeView'
        },
        init: function () {
            this.ssi.$content.find('.ssi-mainContent').prepend(this.template.sideBar);
            this.options.fieldDefinition = $.extend({}, this.defaults.fieldDefinition, this.options.fieldDefinition);
            if (this.options.data.length)
                this.setSidebar(this.options.data);
            this.setButtons();
        },
        setSidebar: function (data) {
            var $sidebar = this.ssi.$content.find('#ssi-sidebarContent');
            if (this.options.state == 'close') {
                $sidebar.parent().addClass('ssi-verticalSlide')
            }
            $sidebar.addClass(this.options.className)
             .html(this.setList(data));

            if (this.options.mode == 'treeView') {
                ssi_treeView($sidebar);
            } else if (this.options.mode == 'accordion') {
                ssi_accordion($sidebar);
            } else if (this.options.mode == 'dropDown') {

                $sidebar.addClass('ssi-dropDownWrapper');
                $sidebar.parent().addClass('ssi-dropDownMode')
            }
            return this;
        },
        setButtons: function () {
            var ssi = this.ssi;
            $(this.template.hideButton).on('click.ssi', function () {
                var $sideBar = ssi.$content.find('#ssi-sidebar');
                $sideBar.toggleClass('ssi-verticalSlide');
                return false;
            }).prependTo(ssi.$content.find('.ssi-topBarButtonArea'));

            if (this.options.resizable)
                this.setDragBar();
        },
        deleteTree: function (id) {
            var $tree = this.ssi.$content.find('#ssi-sidebar').find(document.getElementById(id));
            var $parent = $tree.parent();
            $tree.remove();
            if ($parent.children().length === 0) {
                $parent.parent().removeClass('parent').find('a.ssi-treeTrigger').remove();
            }
        },
        addTree: function (data, parent, tree) {
            parent = parent || 'ssi-sidebarContent';
            var $parent = this.ssi.$content.find(document.getElementById(parent));
            if (this.options.mode != 'treeView')$parent = this.ssi.$content.find('#ssi-sidebarContent').children('ul');
            tree = tree || this.setList(data, true);
            var $ul = $parent.children('ul');
            $ul.append(tree);
            if (!$parent.hasClass('parent')) {
                $parent.addClass('parent');
                if (this.options.mode == 'treeView') $parent.prepend('<a class="ssi-treeTrigger" href="#">');
            }
        },
        editTreeLink: function (id, path, name, newId) {
            this.ssi.$content.find('#ssi-sidebar').find(document.getElementById(id)).children('a.ssi-listAnchor').attr({
                'href': path,
                id: newId
            }).html(name);
        },
        setList: function (data, single) {
            data = Ss_input.tools.toArray(data);
            var template = Ss_input.tools.template,
             list = "", children, className,
             fieldDefinition = this.options.fieldDefinition;
            for (var i = 0, length = data.length; i < length; i++) {
                try {
                 className = '';
                children = '';
                var childrenData = data[i][fieldDefinition.children];
                if (childrenData && childrenData.length > 0) {
                    children = this.setList(childrenData);
                    className = 'parent ' + (data[i].active ? 'active ' : '');
                }
                list += template(this.template.treeItem, {
                    id: data[i][fieldDefinition.id] || "",
                    href: data[i][fieldDefinition.url] || "",
                    name: data[i][fieldDefinition.name] || "",
                    children: children || "<ul></ul>",
                    className: className + (data[i][fieldDefinition.className] || "")
                });
                } catch (err) {
                 console.log(err);
                 }
                 }
            return !single ? '<ul>' + list + '</ul>' : list;
        },
        setDragBar: function () {
            var ssi = this.ssi;
            ssi.$content.find('#ssi-items').prepend(this.template.dragBar);
            ssi.$content.mouseup(function (e) {
                if (dragging) {
                    var sideBar = ssi.$content.find('#ssi-sidebar');
                    var parentWidth = sideBar.parent().width();
                    var minWidth = parentWidth * (10 / 100);
                    var maxWidth = parentWidth * (40 / 100);
                    if (relativeX < minWidth) {
                        relativeX = minWidth;
                    }
                    if (relativeX > maxWidth) {
                        relativeX = maxWidth;
                    }

                    var sideWidth = (100 * relativeX / parentWidth);
                    sideBar.css("width", sideWidth + '%');
                    ssi.$content.find('#ghostbar').remove();
                    ssi.$content.off('mousemove');
                    dragging = false;
                }
            });

            /**@author http://stackoverflow.com/a/6219522/4801797**/
            var dragging = false,
             relativeX;
            ssi.$content.find('#dragbar').mousedown(function (e) {
                e.preventDefault();
                dragging = true;
                var main = ssi.$content.find('#ssi-items');
                var ghostbar = $('<div>',
                 {
                     id: 'ghostbar',
                     css: {
                         height: '100%',
                         top: 0,
                         left: 0
                     }
                 }).appendTo(main);
                $(document).mousemove(function (e) {
                    relativeX = (e.pageX - main.offset().left);
                    ghostbar.css("left", relativeX);
                });
            });
        }
    });
    var ssi_accordion = function (element) {
        $(element).addClass('ssi-accordion').on('click', 'li', function () {
            var $thisLi = $(this);
            $thisLi.siblings('.active').removeClass('active').children('ul').slideUp(300);
            $thisLi.children('ul').slideToggle();
            $thisLi.toggleClass('active');
            return false;
        })

    };
    var ssi_treeView = function (element) {
        var $element = $(element);
        $element.addClass('ssi-treeView')
         .find('li.parent')
         .prepend('<a class="ssi-treeTrigger" href="#"></a>')
         .filter('.active').children('ul').slideToggle('fast');
        $element.off('.ssi_treeView');
        $element.on('click.ssi_treeView', '.ssi-treeTrigger', function () {
            var element = $(this);
            var $parent = element.parent();
            if ($parent.find('.ssi-treeViewRCurrent').length && $parent.hasClass('active')) {
                element.next('a').addClass('ssi-treeViewCurrent');
            } else {
                element.next('a').removeClass('ssi-treeViewCurrent');
            }
            $parent.toggleClass('active');
            $parent.children('ul').slideToggle('fast');
            return false;
        });
    };
})(jQuery);


(function ($) {
    Ss_input.plugins['selectAll'] = Ss_input.Plugin.extend({
        defaults: {
            selectableClasses: {},
            translateFields:''
        },
        require: ['select'],
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi;
            var thisS = this;
            this.options.translateFields = this.options.translateFields || ssi.options.translateFields;
            var buttons = [{
                label: '<span class="icon ssi-selectAllIcon"></span> ' + this.translate('all') + ' <span class="ssi-keyShort">ctrl + a</span>',
                method: function () {
                    thisS.select('ssi-selectable');
                },
                keyPress: {
                    keyCode: '65',
                    ctrl: true
                }
            }];
            for (var alias in this.options.selectableClasses) {
                buttons.push({
                    label: '<span class="ssi-letterIcon">' + alias[0] + '</span><span class="ssi-title"> ' + this.translate(alias,this.options.translateFields) + '</span>',
                    attributes: {'data-ssi_title': alias},
                    method: function () {
                        thisS.select(thisS.options.selectableClasses[$(this).attr('data-ssi_title')]);
                    }
                })
            }
            ssi.addButton({
                label: '<span class="icon ssi-selectionIcon"></span> ' + this.translate('select'),
                id: '',
                className: '',
                subMenu: buttons
            }, 'listButton', ['options']);
        },
        select: function (selection) {
            var ssi = this.ssi;
            var mainTable = ssi.$content.find('.' + selection);
            var items = mainTable.find('.ssi-selectable');
            if (!items.length)items = mainTable;
            var length = items.length;
            var select = ssi.plugins['select'];
            select.removeSelectedList();
            items.addClass('ssi-mActive');
            if (length > 0) {
                ssi.$content.find('.ssi-selectionRequired').removeClass('ssi-hidden');
                ssi.$content.find('.ssi-mustSelect').removeClass('disabled');
            }
            for (var i = 0; i < length; i++) {
                select.selectionList.push($(items[i]).attr('data-ID'));
            }
        }

    })
})(jQuery);

/*





 */
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
                return [];
            }
        },
        setCache: function (data) {
            if (this.options.cacheTo != 'localStorage')return this;
            try {
                sessionStorage.setItem("historyCache" + this.ssi.uniqueId, JSON.stringify(data));
                return this;
            } catch (e) {
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
(function ($) {
    Ss_input.plugins['infoBubble'] = Ss_input.Plugin.extend({
        template: '<#var index=0;for(var dataName in data){if(eval(thisS.condition))continue;#><#=thisS.translate(dataName,thisS.translateFields)#>: <#=data[dataName]#><br><#index++;if (index == thisS.options.limit)break;}#>',
        defaults: {
            limit:4,
            excludeFields: [],
            excludeItems: '',
            translateFields: ''
        },
        init: function () {
            this.options.translateFields = this.options.translateFields || this.ssi.options.translateFields;
            this.setEvent().setCondition();
            return this;
        },
        setCondition:function(){
            if(this.options.excludeFields.length>0){
                this.condition='$.inArray(dataName,thisS.options.excludeFields)>-1'
            }else{
                this.condition='false';
            }
            return this;
        },
        setEvent: function () {
            var time, ssi = this.ssi, thisS = this;
            ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                if (time)
                    clearTimeout(time);
            }).on('changeSchemaAction.ssi', function (e, data) {
                thisS.options.includeFields = data['details'];
                thisS.setCondition();
            });
            ssi.$content.on({
                'mouseenter.ssi': function (e) {
                    e.preventDefault();
                    if (!time) {
                        time = setTimeout(function () {
                            thisS.getInfoBubble(e);
                        }, 2000)
                    }
                },
                'mouseleave.ssi': function () {
                    if (time) {
                        clearTimeout(time);
                        time = null;
                    }
                }
            }, '.ssi-displayDiv');
            return this;
        },
        getInfoBubble: function (e) {
            var $target = $(e.currentTarget);
            var data = this.ssi.getSelectedData($target)[0];
            if (eval(Ss_input.tools.dataReplace(this.options.excludeItems)) == 'true') {
                return;
            }
            var text = Ss_input.tools.template(this.template, {thisS: this, data: data});
            var toolTip = Ss_input.tools.tooltip($target, text, true).appendTo($target.parents('#ssi-items'));
            var relativeX = $target.position().left;
            var relativeY = $target.position().top + $target.height() + 6;
            $target.parents('#ssi-contentFiles').one('scroll', function () {
                toolTip.remove();
            });
            toolTip.css({
                 top: relativeY + 'px',
                 left: relativeX + 'px'
             })
             .removeClass('ssi-fadeOut');
            return this;
        }
    })
})(jQuery);
(function ($) {
    Ss_input.plugins['nameBubble'] = Ss_input.Plugin.extend({
        init: function () {
            this.setEvents();
        },
        setEvents: function () {
            var time;
            this.ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                if (time)
                    clearTimeout(time);
            });
            this.ssi.$content.on({
                'mouseenter.ssi': function (e) {
                    var $eventTarget = $(e.target);
                    if ($eventTarget.outerWidth() < $eventTarget[0].scrollWidth) {
                        if (!time) {
                            time = setTimeout(function () {
                                Ss_input.tools.tooltip($eventTarget, $eventTarget.html()).css('max-width', '350px');
                            }, 2000)
                        }
                    }
                },
                'mouseleave.ssi': function (e) {
                    if (time) {
                        clearTimeout(time);
                        time = null;
                    }
                }
            }, '.ssi-itemName')
        }
    })
})(jQuery);
(function ($) {
    var ssi_rightMenu = false;
    Ss_input.plugins['contextMenu'] = Ss_input.Plugin.extend({
        rightClickItem: '',
        template: '<div class="ssi-dropDownWrapper"><ul id="ssi-contextMenuUl" class="custom-menu ssi-actionBtns"></ul></div>',
        init: function () {
            var ssi = this.ssi;
            ssi.$content.append(this.template);
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            var contextHeight;
            ssi.$element.on("resetAction.ssi", function (e) {
                thisS.rightClickItem = '';
            });
            ssi.$content.on("contextmenu", function (e) {
                if (!$(e.target).is('input')) {
                    e.preventDefault();
                    thisS.setRightClick(e);
                    var $menu = ssi.$content.find('#ssi-contextMenuUl');
                    var offset = $(this).offset();
                    var relativeX = (e.pageX - offset.left);
                    var relativeY = (e.pageY - offset.top);
                    $menu.addClass('ssi-appear');
                    if (!contextHeight) {
                        setTimeout(function () {
                            contextHeight = $menu.height();
                        }, 150)
                    }
                    if (relativeY > (ssi.$content.height() - contextHeight + 75)) {
                        relativeY -= contextHeight;
                    }
                    $menu.css({
                        top: relativeY + "px",
                        left: relativeX + "px"
                    });
                    ssi_rightMenu = true;
                }
            }).on('mouseup.ssi', function (e) {
                 if (ssi_rightMenu) {
                     var eventTarget = $(e.target);
                     if (!eventTarget.parents("#ssi-contextMenuUl").length > 0) {
                         ssi.$content.find('#ssi-contextMenuUl').removeClass('ssi-appear');
                         thisS.rightClickItem = '';
                         ssi.$content.find('.ssi-mustSelect').addClass('disabled').prop('disabled', true);
                         ssi_rightMenu = false;
                     }
                 }
             })
             .find('#ssi-contextMenuUl').on('mouseup.ssi', function () {
                $(this).removeClass('ssi-appear');
                ssi_rightMenu = false;
            })
        },
        setRightClick: function (e) {
            var ssi = this.ssi,
             eventTarget = ssi.get$mainElement($(e.target));
            if (eventTarget.hasClass('ssi-selectable')) {
                var contextMenu= this.ssi.$content.find('#ssi-contextMenuUl');
                contextMenu.find('.ssi-mustSelect').removeClass('disabled');
                contextMenu.find('.ssi-hidden').removeClass('ssi-hidden');
                this.rightClickItem = eventTarget;
                ssi.checkExcludedButtons(function (hiddenFields) {
                    hiddenFields = ssi.$content.find('#ssi-contextMenuUl').find(hiddenFields);
                    var parent = hiddenFields.closest('ul');
                    var allItems = parent.children();
                    if (allItems.length - hiddenFields.length == 0) {
                        parent.parent('li').addClass('ssi-hidden');
                    }
                });
            } else {
                ssi.$content.find('.ssi-mustSelect').addClass('disabled');
            }
        }

    });
})(jQuery);
(function ($) {
    Ss_input.plugins['select'] = Ss_input.Plugin.extend({
        init: function () {
            var ssi = this.ssi;
            var thisS = this;
            ssi.addButton({
                label: '<span class="icon ssi-selectIcon"></span> ' + this.translate('select'),
                id: '',
                className: '',
                method: function () {
                    thisS.mSelect(ssi.get$mainElement(ssi.plugins['contextMenu'].rightClickItem));
                },
                selectionRequired: true
            }, 'listButton', ['contextMenu']);
            this.selectionList = [];
            this.removeSelectedList();
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi;
            var thisS = this;
            var $btn = ssi.addButton({
                label: '<div class="icon ssi-selectImgIcon"></div>',
                id: '',
                className: 'ssi-selectItem',
                method: function (e) {
                    thisS.mSelect(ssi.get$mainElement($(e.currentTarget)));
                },
                selectionRequired: true
            }, 'itemButton');
            this.ssi.$element.on('appendItemAction.ssi', function (e, item) {
                item.$element.find('div.ssi-optionsDiv').append($btn.clone(true));
            });

            ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                thisS.removeSelectedList();
            });
            ssi.$content.on('click.ssi', '.ssi-selectable', function (e) {
                var $e = $(e.currentTarget);
                if (thisS.options.defaultPreviewType === 'details' && $e.hasClass('ssi-displayDiv'))return;
                e.preventDefault();
                if (e.ctrlKey) {
                    thisS.mSelect(ssi.get$mainElement($e));
                } else {
                    $e = $(e.target);
                    if (thisS.options.defaultPreviewType === 'details' && !$e.is('a') && !$e.parent().is('a'))
                        thisS.removeSelectedList();
                }

            }).on('mousedown.ssi', function (e) {
                var eventTarget;
                if (thisS.selectionList.length > 0) {
                    eventTarget = $(e.target);
                    var docContainer = ssi.$content.find('.ssi-itemWrapper');
                    var isETarget = docContainer.is(e.target);
                    var hasETarget = docContainer.has(e.target).length === 0;
                    var hasMultiOpt = eventTarget.hasClass('ssi-selectionRequired');
                    if (thisS.selectionList.length > 0) {
                        if (!e.ctrlKey) {
                            if (!isETarget && hasETarget && !eventTarget.parents('ul').hasClass('ssi-dropdown') && !hasMultiOpt && !eventTarget.is('a') && !eventTarget.parents('ul').hasClass('custom-menu')) {
                                thisS.removeSelectedList();
                            }
                        }
                    }
                }
            });
        },
        mSelect: function (e) {
            var $e = $(e),
             ssi = this.ssi;
            if (this.selectionList.length == 0) {
                this.ssi.$content.find('.ssi-mustSelect').removeClass('disabled');
                ssi.$content.find('.ssi-selectionRequired').removeClass('ssi-hidden');
            }
            if ($e.hasClass('ssi-mActive')) {
                $e.removeClass('ssi-mActive');
                Ss_input.tools.removeFromArray(this.selectionList, $e.attr('data-ID'));
                if (this.selectionList.length < 1) {
                    ssi.$content.find('.ssi-selectionRequired').addClass('ssi-hidden');
                }
            } else {
                $e.addClass('ssi-mActive');
                var info = $e.data('info');
                this.selectionList.push($e.attr('data-ID'));
            }
            ssi.checkExcludedButtons();
        },
        removeSelectedList: function () {
            var ssi = this.ssi;
            this.selectionList = [];
            ssi.$content.find('.ssi-mActive').removeClass('ssi-mActive');
            ssi.$content.find('.ssi-selectionRequired').addClass('ssi-hidden');
            ssi.$content.find('.ssi-mustSelect').addClass('disabled');
            return this;
        }

    })
})(jQuery);
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
(function ($) {
    Ss_input.fileSystemHandlers['imgBox'] = Ss_input.Handler.extend({
        defaults: {
            excludeItems: 'condition:(field:(mimeType).split("/")[0]!="image")',
            imageField: 'path'
        }
    })
})(jQuery);
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
(function ($) {
    Ss_input.fileSystemHandlers['scan'] = Ss_input.Handler.extend({
        group: 'fileSystem',
        defaults: {
            titleField:'name',
            idField: 'path',
            displayImage: 'condition:(field:(mimeType).split("/")[0]=="image"? field:(path):"")',
            itemClass: 'condition:(field:(mimeType).split("/")[0]=="image"||field:(mimeType).split("/")[0]=="directory"?field:(mimeType).split("/")[0]:"ssi-empty")'
        }
    })
})(jQuery);
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
(function ($) {
    Ss_input.fileSystemHandlers['selectAll'] = Ss_input.Handler.extend({
        group: ['fileSystem'],
        defaults: {
            selectableClasses: {folders:'directory',images:'image',textFiles:'text'},
            translateFields:true
        }
    })
})(jQuery);
(function ($) {
    Ss_input.fileSystemHandlers['selection'] = Ss_input.Handler.extend({
        group: 'fileSystem',
        defaults: {
            pathType: 'relative',
            excludeItems: 'condition:(field:(mimeType)=="directory")',
            modeOptions: {
                selectionField: 'path'
            }
        }, init: function () {
            var plugin = this.plugin;
            this.ssi.$element.on('selectionAction.ssi', function (e, selectedInfo) {
                if (plugin.options.pathType == 'absolute') {
                    selectedInfo.selection = document.location.protocol + '//' + window.location.hostname + selectedInfo.selection
                }
            });
        }
    })
})(jQuery);
(function ($) {
    Ss_input.fileSystemHandlers['sidebar'] = Ss_input.Handler.extend({
        group: 'fileSystem',
        defaults: {},
        extend: {
            copyTree: function (id, newHref, appendTree, cut) {
                appendTree = appendTree || true;
                var $tree = this.ssi.$content.find('#ssi-sidebar').find(document.getElementById(id));
                if (!cut) {
                    $tree = $tree.clone();
                }
                var childrenChildul = $tree.attr({'id': newHref}).children('a.ssi-listAnchor').attr({'href': newHref})
                 .html(Ss_input.tools.basename(newHref))
                 .find('ul');
                childrenChildul.css('display', 'none');
                childrenChildul.parent('li').find('.active').removeClass('active');
                var $ul = $tree.parent();
                if (!appendTree)return $tree;
                if (appendTree)this.addTree('', this.ssi.fileSystem.options.rootPath + this.ssi.currentCollection.id, $tree);
                if (cut) {
                    if ($ul.children().length === 0) {
                        $ul.parent().removeClass('parent').find('a.ssi-treeTrigger').remove();
                    }
                }
            }
        },
        init: function () {
            this.getData();
            this.setEvent();
            this.defaults = {
                className: ' ssi-fileSystem',
                fieldDefinition: {
                    name: 'name',
                    id: 'url',
                    url: 'url',
                    children: 'children',
                    className: 'className'
                }
            }
        },
        getData: function () {
            var thisS = this, ssi = this.ssi;
            var callback = function (data) {
                thisS.setSidebar(data);
            };
            var ajaxOptions = {
                data: {'rootPath': this.storage.options.rootPath + '/'},
                url: thisS.storage.options.scriptsPath + '/scanFolderAction.php'
            };
            ssi.ajaxCall(ajaxOptions, callback);

        },
        setSidebar: function (data) {
            var menuData;
            if (this.plugin.options.mode == 'treeView') {
                menuData = [{
                    name: 'root',
                    url: this.ssi.fileSystem.getPath('/'),
                    children: data,
                    active: true
                }]
            } else {
                data.unshift({
                    name: '<div class="icon ssi-rootIcon"></div> root',
                    url: this.ssi.fileSystem.getPath('/'),
                    id: '/',
                    children: []
                });
                menuData = data;
            }
            this.plugin.setSidebar(menuData);
        },
        setEvent: function () {
            var ssi = this.ssi;
            ssi.$content.on('click.ssi', '#ssi-sidebarContent .ssi-listAnchor', function (e) {
                ssi.fileSystem.scanDir($(e.currentTarget).attr('href'));
                $(this).parents().find('.ssi-treeViewCurrent').removeClass('ssi-treeViewCurrent');
                $(this).parents().find('.ssi-treeViewRCurrent').removeClass('ssi-treeViewRCurrent');
                $(this).addClass('ssi-treeViewRCurrent');
                return false;
            });
            ssi.$element.on('changeCollectionAction.ssi', function () {
                ssi.$content.find('.ssi-treeViewCurrent').removeClass('ssi-treeViewCurrent');
                ssi.$content.find('.ssi-treeViewRCurrent').removeClass('ssi-treeViewRCurrent');
            });
        }
    })
})(jQuery);
(function ($) {
    Ss_input.fileSystemHandlers['sort'] = Ss_input.Handler.extend({
        defaults: {
            sortType: 'asc',
            sortBy: 'ext',
            sortableFields: ['ext', 'name', 'date']
        }
    })
})(jQuery);
(function ($) {
    var ssi_uploadedFiles = [];
    Ss_input.fileSystemHandlers['upload'] = Ss_input.Handler.extend({
        group: ['fileSystem'],
        extend: {
            onEachUpload: function (fileInfo) {
                var thisS = this;
                if (fileInfo.uploadStatus === 'success') {
                    var name = fileInfo.name.replace(' ', '-');
                    var item = {
                        'name': name,
                        'mimeType': fileInfo.type,
                        'date': Ss_input.tools.getDate(),
                        'path': thisS.ssi.fileSystem.getPath(name),
                        'size': fileInfo.size,
                        'ext': Ss_input.tools.getExtension(fileInfo.name),
                        'dimensions': 'unknown'
                    };
                    ssi_uploadedFiles.push(item);
                }
            }
        },
        init: function () {
            this.setEvents();
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('uploadCloseAction.ssi', function () {
                thisS.appendItems();
            });
        },
        appendItems: function () {
            if (ssi_uploadedFiles.length)
                this.ssi.plugins['scan'].appendItems(ssi_uploadedFiles);
            ssi_uploadedFiles = [];
            this.ssi.$element.trigger('resetAction');
        }
    })
})(jQuery);