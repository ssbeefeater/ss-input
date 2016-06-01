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
                //removeIf(production)
                console.log(err);
                //endRemoveIf(production)
                return {
                    displayName: (displayName ? Ss_input.tools.escapeHtml(displayName) : Ss_input.tools.basename(id)),
                    selection: selection || id,
                    displayImage: displayImage || id
                };
            }
        }
    })
})(jQuery);