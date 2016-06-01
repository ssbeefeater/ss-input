(function ($) {
    Ss_input.selectionMode['textEditorSelection'] = Ss_input.Plugin.extend({
        defaults: {
            method: function () {
            }
        }, init: function () {
            this.ssi.mode = 'textEditorSelect';
            this.ssi.$element.addClass('ss-input');
            return this;
        },
        pickData: function (id, target) {
            var selectionField = this.selection.getSelectedInfo(id, target).selection;
            if (typeof this.options.method === 'function')
                this.options.method(selectionField);
            ssi_modal.closeAll();
            return this;
        }
    });
})(jQuery);