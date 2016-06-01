(function ($) {
    Ss_input.plugins['infoBubble'] = Ss_input.Plugin.extend({
        template: '<#var index=0;for(var dataName in data){if(eval(thisS.condition))continue;#><#=thisS.translate(dataName,thisS.translateFields)#>: <#=data[dataName]#><br><#index++;if (index == thisS.options.limit)break;}#>',
        defaults: {
            limit:4,
            excludeFields: [],
            excludeItems: '',
            translateFields: ''
        },
        init: function () {
            this.options.translateFields = this.options.translateFields || this.ssi.options.translateFields;
            this.setEvent().setCondition();
            return this;
        },
        setCondition:function(){
            if(this.options.excludeFields.length>0){
                this.condition='$.inArray(dataName,thisS.options.excludeFields)>-1'
            }else{
                this.condition='false';
            }
            return this;
        },
        setEvent: function () {
            var time, ssi = this.ssi, thisS = this;
            ssi.$element.on('resetAction.ssi changeCollectionAction.ssi', function () {
                if (time)
                    clearTimeout(time);
            }).on('changeSchemaAction.ssi', function (e, data) {
                thisS.options.includeFields = data['details'];
                thisS.setCondition();
            });
            ssi.$content.on({
                'mouseenter.ssi': function (e) {
                    e.preventDefault();
                    if (!time) {
                        time = setTimeout(function () {
                            thisS.getInfoBubble(e);
                        }, 2000)
                    }
                },
                'mouseleave.ssi': function () {
                    if (time) {
                        clearTimeout(time);
                        time = null;
                    }
                }
            }, '.ssi-displayDiv');
            return this;
        },
        getInfoBubble: function (e) {
            var $target = $(e.currentTarget);
            var data = this.ssi.getSelectedData($target)[0];
            if (eval(Ss_input.tools.dataReplace(this.options.excludeItems)) == 'true') {
                return;
            }
            var text = Ss_input.tools.template(this.template, {thisS: this, data: data});
            var toolTip = Ss_input.tools.tooltip($target, text, true).appendTo($target.parents('#ssi-items'));
            var relativeX = $target.position().left;
            var relativeY = $target.position().top + $target.height() + 6;
            $target.parents('#ssi-contentFiles').one('scroll', function () {
                toolTip.remove();
            });
            toolTip.css({
                 top: relativeY + 'px',
                 left: relativeX + 'px'
             })
             .removeClass('ssi-fadeOut');
            return this;
        }
    })
})(jQuery);