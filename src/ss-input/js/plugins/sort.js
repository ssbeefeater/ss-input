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
                //removeIf(production)
                console.log(e)
                //endRemoveIf(production)
            }
        }
    })
})(jQuery);

/*





 */