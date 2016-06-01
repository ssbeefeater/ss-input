var Button = function (options, type, $element, input) {
    var defaults = {
        label: '',
        title: '',
        dropDown: false,
        id: '',
        attributes: '',
        selectionRequired: false,
        stopPropagation: true,
        keyPress: '',
        subMenu: false,
        method: function () {
        },
        className: '',
        $element: $element,
        $input: input
    };
    this.options = $.extend({}, defaults, options);
    var thisS = this,
     $template = Ss_input.tools.template(Ss_input.templates.buttons[type], this.options);
    this.$element = $($template).click(function (e) {
        e.preventDefault();
        if (thisS.options.stopPropagation)
            e.stopPropagation();
        if (!$(this).hasClass('disabled')) {
            if (typeof thisS.options.method === 'function') {
                var args = [e];
                if (thisS.options.$input)
                    args.push(Ss_input.tools.sanitizeInput(input.val()));
                thisS.options.method.apply(this, args);
            }
        }
    });
    if (this.options.attributes) {
        this.$element.attr(this.options.attributes);
    }
    if (this.options.keyPress) {
        this.setKeyEvents();
    }
    if (this.options.input) {
        this.getInput();
    } else if (this.options.dropDown) {
        this.setDropDown();
    } else if (this.options.subMenu) {
        this.setSubMenu();
    }
    return this.$element;
};
Ss_input.Button = Button;
Button.prototype = {
    setSubMenu: function () {
        var subUlContent = [];
        for (var y = 0, length2 = this.options.subMenu.length; y < length2; y++) {
            subUlContent.push(new Button(this.options.subMenu[y], 'listButton', this.options.$element));
        }
        this.$element.addClass('parent').append($('<ul>').html(subUlContent));
    },
    setDropDown: function () {
        var $dropDown = $('<div class="ssi-dropDownWrapper">');
        var ulContent = [];
        for (var i = 0, length = this.options.dropDown.length; i < length; i++) {
            ulContent.push(new Button(this.options.dropDown[i], 'listButton', this.options.$element));
        }
        this.$element = $dropDown.append(this.$element.addClass('ssi-dropDown'), $('<ul class="ssi-dropdown">').html(ulContent));
    },
    setKeyEvents: function () {
        var thisS = this;
        var condition = "e.which == thisS.options.keyPress.keyCode &&!$(e.target).is('input')";
        if (this.options.keyPress.ctrl)
            condition += "&&e.ctrlKey";
        if (this.options.keyPress.shift)
            condition += "&&e.shiftKey";
        $((this.options.$element || 'body')).on('keydown.ssi', function (e) {
            if (!thisS.$element.hasClass('disabled') && eval(condition) == true) {
                e.stopPropagation();
                e.preventDefault();
                thisS.$element.eq(0).trigger('click');
            }
        })
    },
    getInput: function () {
        var $input =new Ss_input.Input(this.options.input), thisS = this,
         $div = $('<div class="ssi-btnContainer ' + this.options.input.containerClass + '">').append($input),
         $wrapper = $('<div>').append(this.$element, $div);
        if (this.options.input.enterKey)
            $input.keyup(function (e) {
                if (e.keyCode == 13) {
                    $(this).next().trigger('click');
                }
            });
        this.$element.click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $eTarget = $(this).addClass('disabled');
            $('.ssi-btnContainer').not('.' + thisS.options.input.containerClass).hide(500);
            $div.toggle(500, function () {
                $eTarget.removeClass('disabled');
                $input.focus();
            });
        });
        if(this.options.input.buttons)
        for (var i = 0, length = this.options.input.buttons.length; i < length; i++) {
            $div.append(new Button(this.options.input.buttons[i], 'menuButton', this.options.$element, $input));
        }
        return this.$element = $wrapper;

    }
};
