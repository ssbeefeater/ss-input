(function ($) {
    Ss_input.selectionMode['multiSelection'] = Ss_input.Plugin.extend({
        template: {
            //  dataInput: '<input type="text" placeholder="<#=placeholder#>" class="ssi-dataUrlName" value="<#=value#>" name="<#=name#>" />',
            'inputField': "<td><#=input#></td>",
            table: {
                wrapper: '<table class="ssi-selectedItemWrapper  <#=className#> ssi-multiTable"><tr><th></th><# for (var i = 0, inputLength = inputs.length; i<inputLength; i++) { var input=inputs[i]; #><th><#= input.label #></th><#  } #><th></th></tr></table>',
                item: '<tr data-ID="<#=id#>" <#=(dataCollection?"data-collection="+dataCollection:"")#>  class="ssi-removable  ssi-pickItem ssi-table <#=className#>"><td class="ssi-imgPosition"><div class="ssi-selectionPreview" style="background-image:url(\'<#=displayImage#>\')"></div><div class="ssi-itemName"><#=displayName#></div></td><#=inputs#><td class="ssi-btnPosition"><!--<#if(!className){#><a href="<#= displayImage #>" data-ssi_imgGroup="selectedImages<#=uniqueId#>" class="ssi-imgPreview ssi-imgBox"><div class="icon ssi-imgBoxIcon"></div></a><#}#>--><a href="#" class="ssi-removeChoice"><div class="icon ssi-removeIcon"></div></a></td><input type="hidden" name="<#=inputName#>" value="<#= selectionField #>"/></tr>'
            },
            boxes: {
                wrapper: '<div class="ssi-selectedItemWrapper clearfix ssi-boxes"></div>',
                item: '<table data-ID="<#=id#>" style="float: left;" <#=(dataCollection?"data-collection="+dataCollection:"")#> class="ssi-removable  ssi-pickItem ssi-box  <#=className#>"><tr><td class="ssi-imgPosition"><div class="ssi-selectionPreview" style="background-image:url(\'<#=displayImage#>\')"><div id="ssi-actions"><a href="#" class="ssi-removeChoice"><div class="icon ssi-removeIcon"></div></a></div></div></td></tr><tr><td class="ssinput-mbtnplace"><div class="ssi-itemName"><#=displayName#></div><input type="hidden" name="<#=inputName#>" value="<#= selectionField #>"/></td></tr></table>'
            },
            displayFiles: '<div id="ssi-displayFilesWrapper"><button id="ssi-clearSelected" data-title="<#=selectedBtn#>" class="ssi-clearBtn ssi-mBtn ssi-tooltip"><div class="icon ssi-cleanBtn"></div></button><div data-title="<#=selectedTooltip#>" class="ssi-tooltip ssi-displayFiles"><#=selected#></div><button id="ssi-clearChecked" data-title="<#=checkedBtn#>" class="ssi-mBtn ssi-clearBtn ssi-tooltip"><div class="icon ssi-cleanBtn"></div></button><div id="ssi-displayCheckedFiles" data-title="<#=checkedTooltip#>" class="ssi-displayFiles ssi-tooltip"><#=checked#></div></div>'
        },
        defaults: {
            template: 'table',
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
            if (this.options.template == 'boxes' && this.options.input.length > 0) {
                //removeIf(production)
                console.log('Boxes template is not compatible with inputs!');
                //endRemoveIf(production)
                this.options.template = 'table';
            }

            ssi.$element.addClass('ss-input ssi-multiPickMode');
            var wrapper = this.template[this.options.template].wrapper;
            if (wrapper)
                $(this.options.content).eq(0).html(Ss_input.tools.template(wrapper, {
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
                if (!defaults) {
                    var idFixed = id.split(/:(.+)?/, 2);
                    idFixed = idFixed[1] || idFixed[0];
                    this.checkedItems[y] = idFixed;
                }
            }
            $content.children('.ssi-selectedItemWrapper').append(content);
            if (!defaults)this.ssi.$element.trigger('selectAction', [this.checkedItems]);
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
            this.ssi.$content.find('#ssi-displayCheckedFiles').html(this.checkedFilesCount);
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
            var id = item.attr('data-ID');
            if (!this.options.duplicate) {
                var collection = item.attr('data-collection');
                Ss_input.tools.removeFromArray(this.selected, collection ? collection + ':' + id : id);
            }
            item.remove();
            if (this.radioButtons) {
                setRadioNames(this);
            }
            this.ssi.$element.trigger('removeAction', id);
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