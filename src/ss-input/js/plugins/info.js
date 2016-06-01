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
                //removeIf(production)
                console.log('No items');
                //endRemoveIf(production)
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
