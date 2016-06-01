(function ($) {
    Ss_input.fileSystem['upload'] = Ss_input.Plugin.extend({
        permissions: 'write',
        externalResources: ['$().ssi_uploader()'],
        defaults: {
            data: {},
            uploadOptions: {},
            modalOptions: {}
        },
        init: function () {
            this.setModal();
            this.setUploader();
            this.setButtons();
        },
        setButtons: function () {
            var thisS = this;
            this.ssi.addButton({
                label: '<div class="icon ssi-uploadIcon"></div>',
                title: this.translate('upload'),
                id: 'ssi-uploadBtn',
                keyCode: '',
                className: 'ssi-folderSwitch',
                method: function () {
                    thisS.uploadFiles();
                }
            }, 'menuButton', ['menu']);
        },
        setModal: function () {
            var ssi = this.ssi, thisS = this;
            this.modalOptions = $.extend({}, {
                sizeClass: 'mediumToLarge',
                content: '<input type="file" multiple id="ssi-upload" />',
                title: this.translate('uploadFiles'),
                className: "ssi-uploadModal",
                keepContent: true
            }, this.options.modalOptions);
            this.modalOptions.onShow = function (modal) {
                thisS.ssi.$element.trigger('uploadShowAction.ssi');
                var $upload = modal.get$content().find('#ssi-upload').data('ssi_upload');
                if ($upload) {
                    $upload.options.data.currentDir = ssi.fileSystem.options.rootPath + ssi.currentCollection.id;
                }
                if (typeof thisS.options.modalOptions.onShow === 'function')
                    thisS.options.modalOptions.onShow(modal);
            };
            this.modalOptions.onClose = function (modal) {
                if (typeof thisS.options.modalOptions.onClose === 'function')
                    thisS.options.modalOptions.onClose(modal);
                thisS.ssi.$element.trigger('uploadCloseAction.ssi');
            }

        },
        setUploader: function () {
            var ssi = this.ssi, thisS = this;
            this.uploaderOptions = $.extend({}, {
                url: ssi.fileSystem.options.scriptsPath + '/uploadAction.php',
                locale: ssi.options.language,
                responseValidation: ssi.fileSystem.options.responseValidation,
                dropZone: true,
                multiple: true,
                preview: true,
                errorHandler: {
                    method: function (msg, type) {
                        ssi.notify(type, msg)
                    }, success: 'success', error: 'error'
                },
                beforeEachUpload: function (imgInfo, xhr) {
                    if (ssi.getItemData('name', imgInfo.name)) {
                        xhr.abort();
                        return thisS.translate('existError');
                    }
                },
                onEachUpload: function (fileInfo) {
                    thisS.onEachUpload(fileInfo)
                },
                maxFileSize: 3,
                allowed: ssi.fileSystem.options.allowed
            }, this.options.uploadOptions);
        },
        onEachUpload: function (fileInfo) {

        },
        uploadFiles: function () {
            var ssi = this.ssi;
            if (ssi.readOnlyMode)return;
            var modal = ssi.createWindow(this.modalOptions, '#ssi-uploadBtn');
            this.uploaderOptions.data = $.extend({}, {currentDir: ssi.fileSystem.options.rootPath + ssi.currentCollection.id}, this.options.data);
            modal.get$content().find('#ssi-upload').ssi_uploader(this.uploaderOptions);
        }
    })
})(jQuery);
