var Input = function (options, defaultValue) {
    var defaults = {
        checked: true,
        className: "",
        id: "",
        name: "",
        type: "text",
        value: ""
    };
    this.options = $.extend({}, defaults, options);
    this.defaultValue = defaultValue||this.options.value;
    if (this[this.options.type]) {
        this[this.options.type]();
    } else {
        this.setInput();
    }
    return $(this.$element);
};
Ss_input.Input = Input;
Input.prototype = {
    select: function () {
        this.options.select = this.options.select || [];
        this.options.multiple = this.options.multiple || "";
        var optionDefaults = {
            value: "",
            label: "",
            selected: false
        }, selectItems = "";
        this.options.multiple = (this.options.multiple ? "multiple" : "");
        for (var i = 0, length = this.options.options.length; i < length; i++) {
            var itemOption = $.extend({}, optionDefaults, this.options.options[i]);
            if (typeof this.defaultValue !== "undefined") {
                this.defaultValue = Ss_input.tools.toArray(this.defaultValue);
                itemOption.selected = $.inArray(itemOption.value, this.defaultValue) !== -1;
            }
            itemOption.selected = (itemOption.selected ? 'selected' : '');
            selectItems += Ss_input.tools.template(Ss_input.templates.input.selectItem, {options: itemOption});
        }
        this.$element = Ss_input.tools.template(Ss_input.templates.input.select, {
            options: this.options,
            selectItems: selectItems
        });
    },
    radio: function () {
        var radioGroupItems = '';
        var radioDefaults = {
            value: "",
            label:'',
            name: this.options.name,
            checked: false,
            type:"radio"
        };
        for (var i = 0; i < this.options.radio.length; i++) {
            var radio = this.options.radio[i],
             radioOptions = $.extend({}, radioDefaults, radio);
            radioOptions.checked = (typeof this.defaultValue!=='undefined' ? (radioOptions.value == this.defaultValue) : radioOptions.checked);
            radioGroupItems += Ss_input.tools.template(Ss_input.templates.input.radio, {options: radioOptions});
        }
        this.$element = Ss_input.tools.template(Ss_input.templates.input.radioGroup, {
            options: this.options,
            radioGroupItems: radioGroupItems
        });
    },
    checkbox: function () {
        this.options.checked = (typeof this.defaultValue!=='undefined' ? this.defaultValue : this.options.checked);
        this.$element = Ss_input.tools.template(Ss_input.templates.input['checkbox'], {options: this.options});
    },
    setInput: function () {
        this.options.value = this.defaultValue;
        var inputTemplates=Ss_input.templates.input;
        var template=inputTemplates[this.options.type]||inputTemplates['text'];
        this.$element = Ss_input.tools.template(template, {options: this.options});
    }
};
