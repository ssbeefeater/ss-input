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