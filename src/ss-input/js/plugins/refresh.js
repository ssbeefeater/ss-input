(function () {
    Ss_input.plugins['refresh'] = Ss_input.Plugin.extend({
         init: function () {
             var ssi = this.ssi;
             var thisS = this;
             ssi.addButton({
                 label: '<div class="icon ssi-refreshIcon"></div>',
                 title: this.translate('refresh'),
                 id: 'ssi-refresh',
                 keyCode: 'r',
                 className: 'ssi-urlSwitch',
                 method: function () {
                     thisS.refresh(ssi.currentCollection.id);
                 }
             }, 'menuButton', ['menu'])
         },
         refresh: function () {
             if (this.ssi.readOnlyMode)return;
             var ssi = this.ssi;
             var cache = ssi.plugins['cache'];
             if (cache) {
                 cache.removeCachedPage(ssi.currentCollection.id)
             }
             ssi.$element.trigger('resetAction.ssi');
             ssi.plugins['scan'].scanCollection(ssi.currentCollection.id,ssi.currentCollection.url,ssi.currentCollection.data);
         }
     }
    )
})();