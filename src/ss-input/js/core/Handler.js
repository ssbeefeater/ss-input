(function ($) {

    Ss_input.handlers = [];
    var Handler = function (ss_input,pluginInstance,pluginName) {
        this.ssi = ss_input;
        this.plugin=pluginInstance;
        this.pluginName=pluginName;
        this.storage=ss_input.corePlugins[ss_input.options.storageType];
        this.init();
        this.setDefaults(this.defaults);
        this.extendPlugin(this.extend);
    };
    Ss_input.Handler = Handler;
    Handler.prototype = {
        locale: {},
        group:'fileSystem',
        template:{},
        extend:{},
        defaults:{},
        require:[],//Plugins that are required. If something from this list did not load the plugin wont load too.
        init: function () {
        },
        extendPlugin:function(proto){
            $.extend(Object.getPrototypeOf(this.plugin) ,proto);
        },
        setDefaults: function (defaults) {
            $.extend(this.plugin.options,defaults,(this.ssi.options[this.pluginName]||{}));
        },
        unload:function(name){
            this.ssi.pluginNames[ this.ssi.pluginNames.indexOf(name)]=null;
            Ss_input.tools.removeByKey(this.ssi[this.type],name);
        }
    };
    Handler.extend = function (prototype,handlerName) {
        var handler = (handlerName? Ss_input.handlers[handlerName]:this),
         child;
        if(!handler){
            console.log('The handler '+handlerName+' hasn\'t initialize!');
            return;
        }
        if (prototype.hasOwnProperty('constructor')) {
            child = prototype.constructor;
        }else {
            child = function () {
                return handler.apply(this, arguments);
            };
        }
        $.extend(child.prototype, handler.prototype, prototype);
        return child;
    };


})(jQuery);