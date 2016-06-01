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
                //removeIf(production)
                /*
                 //endRemoveIf(production)
                 try {
                 //removeIf(production)
                 */
                //endRemoveIf(production)
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
                //removeIf(production)
                /*
                 //endRemoveIf(production)
                 } catch (err) {
                 console.log(err);
                 }
                 //removeIf(production)
                 */
                //endRemoveIf(production)
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

