(function ($) {

    Ss_input.plugins = [];
    Ss_input.storageTypes = [];
    Ss_input.modePlugins = [];
    var Plugin = function (ss_input, options) {
        for (var i = 0, length = this.externalResources.length; i < length; i++) {
            try {
                var obj = this.externalResources[i];
                eval(obj)
            } catch (err) {
                //removeIf(production)
                console.log(err);
                //endRemoveIf(production)
                console.log('A required external resource not found:' + obj);
                return {};
            }
        }
        this.ssi = ss_input;
        this.options = $.extend({}, this.defaults, options);
    };
    Ss_input.Plugin = Plugin;
    Plugin.prototype = {
        permissions: 'read',
        locale: {},
        defaults: {},
        template: {},
        externalResources: [],
        type: 'plugins',//or corePlugins
        defaultLanguage: 'en',
        require: [],//Plugins that are required. If something from this list did not load the plugin wont load too.
        translate: function (word, fieldTranslation) {
            var translation;
            if (fieldTranslation == false)
                return word;
            try {
                translation = this.locale[this.ssi.options.language][word];
                if (!translation) {
                    throw 'error';
                }
                return translation;
            } catch (e) {
                try {
                    translation = Ss_input.locale[this.ssi.options.language][word];
                    if (!translation) {
                        throw 'error';
                    }
                    return translation;
                } catch (e) {
                    try {
                        translation = Ss_input.locale[this.defaultLanguage][word];
                        if (!translation) {
                            throw 'error';
                        }
                        return translation;
                    } catch (e) {
                        return word
                    }
                }
            }
        },
        init: function () {
        },
        unload: function (name) {
            this.ssi.pluginNames[this.ssi.pluginNames.indexOf(name)] = null;
            Ss_input.tools.removeByKey(this.ssi[this.type], name);
        }
    };
    Plugin.extend = function (prototype, pluginName, pluginGroup) {
        pluginGroup = pluginGroup || Ss_input.plugins;
        var plugin = (pluginName ? pluginGroup[pluginName] : this),
         child;
        if (!plugin) {
            console.log('The plugin ' + pluginName + ' hasn\'t initialize!');
            return function () {
            };
        }
        if (prototype.hasOwnProperty('constructor')) {
            child = prototype.constructor;
        } else {
            child = function () {
                return plugin.apply(this, arguments);
            };
        }
        $.extend(true, child.prototype, plugin.prototype, prototype);
        return child;
    };

})(jQuery);