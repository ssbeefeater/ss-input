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
                if (!Ss_input.tools.isFile(selectedInfo.displayImage,['jpg', 'png', 'jpeg'])) {
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
                //removeIf(production)
                console.log(err);
                //endRemoveIf(production)
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