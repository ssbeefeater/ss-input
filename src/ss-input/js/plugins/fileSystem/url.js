(function ($) {
    Ss_input.fileSystem['url'] = Ss_input.Plugin.extend({
        defaults: {
            ajaxOptions: {},
            data: {}
        },
        init: function () {
            if (this.ssi.options.mode != 'selection')
                return;
            this.setButtons();

        },
        setButtons: function () {

            var ssi = this.ssi, thisS = this;
            var inputButtons = [{
                label: '<div class="icon ssi-checkIcon"></div>',
                className: 'ssi-inBtn ssi-inUrlBtn',
                method: function () {
                    thisS.addUrl();
                }
            }];
            ssi.addButton({
                label: '<div class="icon ssi-urlIcon"></div>',
                title: this.translate('addUrl'),
                id: '',
                keyCode: '',
                input: {
                    enterKey: true,
                    containerClass: 'ssi-urlcont',
                    className: 'ssi-urlInput ssi-menuInput',
                    placeholder: this.translate('url'),
                    id: 'ssi-url',
                    tooltip: this.translate('uploadImg'),
                    buttons: inputButtons
                },
                className: 'ssi-urlSwitch'
            }, 'menuButton', ['menu']);

        },
        addUrl: function () {
            var ssi = this.ssi;
            var url = ssi.$content.find('#ssi-url').val();
            if (url != '') {
                var thisS = this;
                var test = this.testUrl(url);
                if (!test)return;
                var callback = function () {
                    console.log()
                    if (ssi.corePlugins.selection.options.selectionMode === 'multiSelection') {
                        ssi.notify('success', thisS.translate('addSuccess'));
                    }
                    ssi.corePlugins['selection'].selectItem(url, '', true);
                };
                this.IsValidImageUrl(url, callback);
            }
        },
        testUrl: function (url) {
            var dataUri = false, image = false, ext, thisS = this, ssi = this.ssi, msg;
            if (/^(http|https|ftp):\/\/[a-z0-9]+([\-\.][a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)+\.[a-z0-9]+$/i.test(url)) {
                ext = Ss_input.tools.getExtension(url);
                image = true
            }
            if (!image) {
                if (isDataURL(url)) {
                    dataUri = true;
                    var regex = new RegExp(/^(data:)([\w\/\+]+);(charset=[\w-]+|base64).*,(.*)/gi);
                    ext = regex.exec(url)[2].split('/')[1]
                }
            }
            if (!image && !dataUri) {
                ssi.notify('error', thisS.translate('invalidUrlError'));
                return false;
            }
            if ($.inArray(ext, ssi.fileSystem.options.allowed) < 0 && !dataUri) {
                ssi.notify('error', Ss_input.tools.replaceText(thisS.translate('extError'), ext));
                return false;
            }
            return (dataUri ? 'dataUrl' : true);
        },
        IsValidImageUrl: function (url, callback) {
            var thisS = this, ssi = this.ssi;
            $("<img>", {
                src: url,
                error: function () {
                    ssi.notify('error', thisS.translate('invalidUrlError'));
                },
                load: function () {
                    callback();
                }
            });
        }
    });
    function isDataURL(s) {
        return !!s.match(isDataURL.regex);
    }

    isDataURL.regex = /^\s*data:([a-z]+\/[a-z0-9\-\+]+(;[a-z\-]+\=[a-z0-9\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
})(jQuery);