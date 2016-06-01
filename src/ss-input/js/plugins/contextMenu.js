(function ($) {
    var ssi_rightMenu = false;
    Ss_input.plugins['contextMenu'] = Ss_input.Plugin.extend({
        rightClickItem: '',
        template: '<div class="ssi-dropDownWrapper"><ul id="ssi-contextMenuUl" class="custom-menu ssi-actionBtns"></ul></div>',
        init: function () {
            var ssi = this.ssi;
            ssi.$content.append(this.template);
            this.setEvents();
        },
        setEvents: function () {
            var ssi = this.ssi, thisS = this;
            var contextHeight;
            ssi.$element.on("resetAction.ssi", function (e) {
                thisS.rightClickItem = '';
            });
            ssi.$content.on("contextmenu", function (e) {
                if (!$(e.target).is('input')) {
                    e.preventDefault();
                    thisS.setRightClick(e);
                    var $menu = ssi.$content.find('#ssi-contextMenuUl');
                    var offset = $(this).offset();
                    var relativeX = (e.pageX - offset.left);
                    var relativeY = (e.pageY - offset.top);
                    $menu.addClass('ssi-appear');
                    if (!contextHeight) {
                        setTimeout(function () {
                            contextHeight = $menu.height();
                        }, 150)
                    }
                    if (relativeY > (ssi.$content.height() - contextHeight + 75)) {
                        relativeY -= contextHeight;
                    }
                    $menu.css({
                        top: relativeY + "px",
                        left: relativeX + "px"
                    });
                    ssi_rightMenu = true;
                }
            }).on('mouseup.ssi', function (e) {
                 if (ssi_rightMenu) {
                     var eventTarget = $(e.target);
                     if (!eventTarget.parents("#ssi-contextMenuUl").length > 0) {
                         ssi.$content.find('#ssi-contextMenuUl').removeClass('ssi-appear');
                         thisS.rightClickItem = '';
                         ssi.$content.find('.ssi-mustSelect').addClass('disabled').prop('disabled', true);
                         ssi_rightMenu = false;
                     }
                 }
             })
             .find('#ssi-contextMenuUl').on('mouseup.ssi', function () {
                $(this).removeClass('ssi-appear');
                ssi_rightMenu = false;
            })
        },
        setRightClick: function (e) {
            var ssi = this.ssi,
             eventTarget = ssi.get$mainElement($(e.target));
            if (eventTarget.hasClass('ssi-selectable')) {
                var contextMenu= this.ssi.$content.find('#ssi-contextMenuUl');
                contextMenu.find('.ssi-mustSelect').removeClass('disabled');
                contextMenu.find('.ssi-hidden').removeClass('ssi-hidden');
                this.rightClickItem = eventTarget;
                ssi.checkExcludedButtons(function (hiddenFields) {
                    hiddenFields = ssi.$content.find('#ssi-contextMenuUl').find(hiddenFields);
                    var parent = hiddenFields.closest('ul');
                    var allItems = parent.children();
                    if (allItems.length - hiddenFields.length == 0) {
                        parent.parent('li').addClass('ssi-hidden');
                    }
                });
            } else {
                ssi.$content.find('.ssi-mustSelect').addClass('disabled');
            }
        }

    });
})(jQuery);