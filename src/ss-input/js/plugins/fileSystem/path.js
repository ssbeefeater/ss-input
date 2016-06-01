(function ($) {
    Ss_input.fileSystem['path'] = Ss_input.Plugin.extend({
        template: {
            pathBar: '<div style="float:left" id="ssi-loading"></div><div class="ssi-homePath" style="float:left"><a href="#" data-ID="/" class="<#=className#> ssi-path"><div class="icon ssi-rootIcon"></div><#=rootName#></a></div><div class="ssi-currentPath"></div>',
            pathItem: '<div class="ssi-pathItemWrapper"><div class="icon ssi-breadcrumbsIcon"></div><a href="#" data-ID="<#=dataHref#>" class="<#=className#> ssi-path"><#=pathName#></a></div>'
        },
        defaults: {
            className: '',
            rootName: 'root'
        },
        init: function () {
            this.ssi.$content.find('#ssi-topBar').append(Ss_input.tools.template(this.template.pathBar, {
                className: this.options.className,
                rootName: this.options.rootName
            }));
            this.setEvents();
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$content.on('click.ssi', '.ssi-path', function () {
                var $this=$(this);
                if($this.hasClass('ssi-alias'))return false;
                thisS.ssi.fileSystem.scanDir($this.attr('data-ID'));
                return false;
            });
            this.ssi.$element.on('beforeEchoItemsAction.ssi', function (e) {
                var page=thisS.ssi.currentCollection;
                if (!page.id)return;

                var path = page.alias || thisS.ssi.currentCollection.id,
                 dataHref = '' || page.href;
                thisS.setPath(path, dataHref);
            });
        },
        setPath: function (pathName, href) {
            var ssi = this.ssi;
            var currentPath = ssi.$content.find('.ssi-currentPath');
            if (href) {
                currentPath.html(Ss_input.tools.template(this.template.pathItem, {
                    dataHref: href,
                    className: 'ssi-alias',
                    pathName: pathName
                }));
                return;
            }
            var path = pathName.split('/'), dataHref = '', adrArray = []
             , length = path.length
             , pathWidth = (currentPath.outerWidth() - 100), pathLength = 0;
            currentPath.html('');
            for (var i = 0; i < length; i++) {
                if (dataHref != pathName) {
                    dataHref = Ss_input.tools.urlUnion(dataHref, path[i]);
                }
                if (path[i] != '/' && path[i] != '') {
                    var link = Ss_input.tools.template(this.template.pathItem, {
                        dataHref: dataHref,
                        className: this.options.className,
                        pathName: path[i]
                    });
                    adrArray.push(link);
                    var $link = $(link);
                    pathLength += $link.hide().appendTo(currentPath).outerWidth();
                    $link.remove();
                }
            }
            i = 0;
            while (pathLength > pathWidth && pathWidth > 0 && i < path.length) {
                adrArray.shift();
                $link = $(Ss_input.tools.template(this.template.pathItem, {
                    dataHref: dataHref,
                    className: this.options.className,
                    pathName: path[i + 1]
                }));
                pathLength = pathLength - $link.hide().appendTo(currentPath).outerWidth();
                $link.remove();
                i++;
            }
            if (adrArray.length) {
                currentPath.html(adrArray);
            }
        }
    });

})(jQuery);