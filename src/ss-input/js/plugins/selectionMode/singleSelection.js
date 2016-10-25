(function ($) {
    Ss_input.selectionMode['singleSelection'] = Ss_input.Plugin.extend({
        template: {
            imgHolder: '<table class="ssi-pickItem ssi-selectedItemWrapper ssi-itemWrapper"><tr><td class="ssi-imgHolder"><div class="ssi-selectionPreview"><div id="ssi-actions"><!--<a href="#" id="ssi-pickedImg" class="ssi-imgBox ssi-imgPreview ssi-hidden"><div class="icon ssi-imgBoxIcon"></div></a>--><a href="#" class="ssi-removeChoice ssi-hidden"><div class="icon ssi-removeIcon"></div></a></div><div id="ssi-imgChoose" class="ss-input ssi-pick ssi-selectionPreview"></div></div></td></tr><tr><td><div class="ssi-itemName"></div></td></tr><#=input#></table>',
            textHolder: '<div class="ssi-pickItem ssi-selectedItemWrapper ssi-itemWrapper"><span class="ssi-textPreview"></span><#= input #></div><a href="#" class="ssi-removeChoice"><div class="icon ssi-removeIcon"></div></a>',
            input: '<input  id="<#=name#> type="<#=(type||"text")#>" placeholder="<#=placeholder#>" class="ssi-dataUrlName" value="<#=value#>" name="<#=name#>" />',
            mainInput: '<input id="<#=name#>" type="hidden" class="ssi-mainInput" name="<#=name#>"/>'
        },
        defaults: {
            template: 'imgHolder',
            defaultValue: '',
            selectionField: '',
            inputName: 'ssInput'
        },
        init: function () {
            var ssi = this.ssi;
            if (!ssi.$element.is('div')) {
                console.log('The targeted element is not a div.');
                return;
            }
            ssi.$element.addClass('ssi-' + this.options.template);
            ssi.$element.append(Ss_input.tools.template(this.template[this.options.template], {input: '<input id="' + this.options.inputName + '" type="hidden" class="ssi-mainInput" name="' + this.options.inputName + '"/>'}));
            if (this.options.defaultValue) {
                this.pickData(this.options.defaultValue, '', true);
            }
            this.setEvents();
            return this;
        },
        setEvents: function () {
            var thisS = this;
            this.ssi.$element.on('click', '.ssi-removeChoice', function (e) {
                e.preventDefault();
                thisS.removeSelectedImage();
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
            return this;

        },
        pickData: function (id, target, silent) {
            var $target = $(target);
            id = id || $target.attr('data-ID');
            if (!id) {
                console.log('Cant\'t find the id.');
                return this;
            }
            var info = this.selection.getSelectedInfo(id, target, silent);
            var ssi$Element = this.ssi.$element;
            ssi_modal.closeAll();
            ssi$Element.find('a').removeClass('ssi-hidden');
            ssi$Element.find('.ssi-itemName').html(info.displayName );
            ssi$Element.find('.ssi-itemWrapper').removeClass('ssi-empty');
            Ss_input.tools.loadImage( ssi$Element.find('#ssi-imgChoose'),info.displayImage);
            ssi$Element.find('.ssi-mainInput').val(info.selection);
            if(!silent)ssi$Element.trigger('selectAction', info.selection);
            return this;
        },
        removeSelectedImage: function () {
            var ssiElement = this.ssi.$element;
            var $input=ssiElement.find('#' + this.options.inputName);
            ssiElement.find('.ssi-itemWrapper').removeClass('ssi-empty');
            ssiElement.find('#ssi-imgChoose').css("background-image", '');
            ssiElement.find('a').addClass('ssi-hidden');
            ssiElement.find('.ssi-itemName').html('');
            ssiElement.trigger('removeAction', $input.val());
            $input.val('');
            return this;
        }

    });
})(jQuery);