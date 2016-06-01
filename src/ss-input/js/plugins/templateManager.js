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

