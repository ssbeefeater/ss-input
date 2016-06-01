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
                    //removeIf(production)
                    /*
                     //endRemoveIf(production)
                     try {
                     //removeIf(production)
                     */
                    //endRemoveIf(production)
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
                    //removeIf(production)
                    /*
                     //endRemoveIf(production)
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
                     //removeIf(production)
                     */
                    //endRemoveIf(production)
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