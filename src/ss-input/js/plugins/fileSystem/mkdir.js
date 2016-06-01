(function ($) {
    Ss_input.fileSystem['mkdir'] = Ss_input.Plugin.extend(
     {
         "permissions": 'write',
         defaults: {
             data: {},
             ajaxOptions: {}
         },
         init: function () {
             this.setButtons();
         },
         setButtons: function () {
             var ssi = this.ssi, thisS = this;
             ssi.addButton({
                 label: '<div class="icon ssi-mkdirIcon"></div>',
                 title: this.translate('createFolder'),
                 id: '',
                 keyPress: {
                     keyCode: '76',
                     ctrl: true,
                     shift: true
                 },
                 input: {
                     enterKey: true,
                     containerClass: 'ssi-foldercont',
                     className: 'ssi-folderInput ssi-menuInput',
                     placeholder: this.translate('name'),
                     id: 'ssi-nameFolder',
                     buttons: [{
                         label: '<div class="icon ssi-checkIcon"></div>',
                         className: 'ssi-inBtn ssi-inFolderBtn',
                         method: function () {
                             thisS.mkdir(ssi.$content.find('#ssi-nameFolder').val());
                         }
                     }]
                 },
                 className: 'ssi-folderSwitch'
             }, 'menuButton', ['menu']);
         },
         mkdir: function (name) {
             var ssi = this.ssi, thisS = this;
             var fileSystem = ssi.fileSystem;

             name = (name || ssi.$content.find('#ssi-nameFolder').val()).replace(/[\[\]/#<$+%>!`&*'|{?"=}\/:\\@\{]/g, '');
             if (name && !ssi.readOnlyMode) {
                 var href = ssi.fileSystem.getPath(name);
                 if (ssi.getItemData('name', name)) {
                     ssi.notify('error', this.translate('folderExistError').replaceText(name));
                     return;
                 }
                 var callback = function () {
                     ssi.notify('success', thisS.translate('successCreated'));
                     var item = {
                         'name': name,
                         'mimeType': 'directory',
                         'date': Ss_input.tools.getDate(),
                         'path': fileSystem.getPath(name),
                         'size': 0,
                         'type': 'zzzzfolder'
                     };
                     ssi.plugins['scan'].appendItems(item);
                     var sideBar = ssi.plugins['sidebar'];
                     if (sideBar)
                         sideBar.addTree({
                             name: name,
                             url: href
                         }, fileSystem.options.rootPath + ssi.currentCollection.id);
                     ssi.$content.find('#ssi-nameFolder').val('');
                     ssi.$content.find('.ssi-foldercont').hide(500);
                     ssi.$element.trigger('resetAction.ssi');
                 };
                 var data = $.extend({}, this.options.data, {
                     'dirname': name,
                     currentDir: fileSystem.options.rootPath + ssi.currentCollection.id
                 });
                 var ajaxOptions = $.extend({}, {
                     data: data,
                     url: fileSystem.options.scriptsPath + '/mkdirAction.php'
                 }, this.options.ajaxOptions);
                 ssi.ajaxCall(ajaxOptions, callback);
             }
         }
     })
})(jQuery);