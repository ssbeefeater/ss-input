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
                        ssi.notify('error', Ss_input.tools.replaceText(thisS.translate('existError'), newName));
                        return;
                    }
                    var cachedItem = ssi.getItemData('name', value);
                    if (cachedItem.type !== 'zzzzfolder') {
                        newExtension = Ss_input.tools.getExtension(newName);
                        if ($.inArray(newExtension.toLowerCase(), ssi.fileSystem.options.allowed) === -1) {
                            ssi.notify('error', Ss_input.tools.replaceText(thisS.translate('extError'), newExtension));
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
                            var elementInfo = $element.data('info');
                            elementInfo.name = newName;
                            elementInfo.path = Ss_input.tools.urlUnion(ssi.currentCollection.id, newPath);
                            var cache = ssi.plugins['cache'];
                            if (cache) {
                                var historyCache = cache.getCache();
                                cachedItem = cache.getCachedItem('name', value, '', historyCache);
                                if (cachedItem) {
                                    cachedItem.name = newName;
                                    cachedItem.path = elementInfo.path;
                                }
                                cache.setCache(historyCache);
                            }
                            var sideBar = ssi.plugins['sidebar'];
                            if (!Ss_input.tools.isFile(oldPath, ssi.fileSystem.options.allowed) && sideBar) {
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