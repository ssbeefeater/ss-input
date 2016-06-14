(function ($) {
    Ss_input.fileSystem['openInBrowser'] = Ss_input.Plugin.extend({
        init: function () {
            this.setButtons();
        },
        setButtons: function () {
            var ssi = this.ssi, thisS = this;
            ssi.addButton({
                label: '<div class="icon ssi-openInBrowserIcon">' + this.translate('openInBrowser') + '</div>',
                method: function () {
                    thisS.openInBrowser();
                },
                className:'ssi-openInBtn',
                selectionRequired: true
            }, 'listButton', ['contextMenu'], 'condition:(field:(mimeType)!="directory")');
        },
        openInBrowser: function () {
            var ssi = this.ssi;
            var name = ssi.getSelectedField('name')[0];
            window.open(ssi.fileSystem.getPath(name), '_blank');
        }
    });
})(jQuery);