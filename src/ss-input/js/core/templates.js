(function ($) {
    Ss_input.templates = {
        buttons: {
            'menuButton': '<# if(selectionRequired) className+=" ssi-selectionRequired ssi-hidden";  #><button id="<#= id #>" data-title="<#= title #>" class="ssi-tooltip <#= className #> ssi-mBtn"> <#= label #> </button>',
            'listButton': '<# var LiClassName; if(selectionRequired){className+=" ssi-mustSelect disabled";} #><li id="<#= id #>" class="<#= className #> "><a href="#" > <#= label #> </a></li>',
            'itemButton': '<a href="#" id="<#= id #>" class="<#= className #> ssi-optionBtn"><#= label #></a>'
        },
        input: {
            select:'<select <#= options.multiple#> id = "<#=options.id#>" name ="<#=options.name#>" class="<#=options.className#>" ><#= selectItems#></select >',
            selectItem:'<option <#=options.selected#> value="<#=options.value#>"><#=options.label#></option>',
            textarea:'<textarea  id = "<#=options.id#>"  name = "<#=options.name#>" class= "<#=options.className#>"  <#=options.readOnly#> ><#=options.value#></textarea>',
            text:'<input type = "<#=options.type#>" placeholder="<#= options.placeholder#>" id = "<#=options.id#>"  name = "<#=options.name#>" class= "<#=options.className#>" value = "<#=options.value#>"/ >',
            radioGroup:'<div class="ssi-radioGroup <#=options.className#>" id="<#=options.id#>" ><#=radioGroupItems#></div>',
            radio:'<div class="ssi-radioItem"><label><#=options.label#></label><input type="<#=options.type#>"<#=options.checked?"checked":""#>  name="<#=options.name#>"  value="<#=options.value#>"/></div>'
        },
        mainContent: '<div id="ssi-content" tabindex="1"><div id="ssi-menuButtons" class="ssi-menuButtons"></div><div id="ssi-topBarWrapper" class="ssi-topBarWrapper"> <div class="ssi-topBarButtonArea"></div><div id="ssi-topBar" class="ssi-topBar"> <div id="ssi-loader" class="ssi-hidden ssi-loadingIcon ssi-pathLoader"></div><div id="ssi-progressBar" class="ssi-progress"></div></div></div><div id="ssi-mainContent" class="ssi-mainContent"><div id="ssi-items" class="ssi-items"><div id="ssi-contentFiles"></div></div></div></div>',
        bottomButtons: '<div id="ssi-bottomButtons" class="ssi-bottomButtons"><div id="ssi-leftButtons" class="ssi-leftButtons"></div><div id="ssi-rightButtons" class="ssi-rightButtons"></div></div>',
    }
})(jQuery);
