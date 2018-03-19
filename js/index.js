$.ajaxSetup({
    async: false
});

var editor;

$(function(){

    JSONEditor.defaults.options.theme = 'jqueryui';
    JSONEditor.defaults.options.iconlib = 'jqueryui';
    JSONEditor.defaults.editors.object.options.collapsed = true;
    JSONEditor.defaults.editors.array.options.collapsed = true;

    $( "#valid_indicator" ).dialog({
        maxWidth: 800,
        maxHeight: 800,
        width: 500,
        height: 200,
        closeOnEscape: false,
        position: {my: "right top", at: "right top", of: window},
        dialogClass: "no-close",
        create: function (event) {
            $(event.target).parent().css({ "position": "fixed", "right": 50, "top": 150 });
        }
    });

    $("#version").selectmenu({width: 100, change: function(event,ui){
        schemaVersion = event.target.value;
        if (schemaVersion != ""){ 
            $("#progress").removeClass("hide");
            template = getJsonSchemas(schemaVersion);
            if (editor){
                editor.template = template;
            }else {
                editor = new JSONEditor($("#editor_holder")[0],{
                    keep_oneof_values:false,
                    // display_required_only: true,
                    schema: template
                });
                initEditor(editor);
                $("#controls").removeClass("hide");
            }
        }
    }});
 
    function initEditor(editor){       
        editor.on("change",function() {
            // Get an array of errors from the validator
            var errors = editor.validate();
            var indicator = $("#valid_indicator");
            
            // Not valid
            if(errors.length) {
                var errorStr = "";
                errors.forEach(function(err){
                    if(!err.message.startsWith("Value must validate against") && !err.message.startsWith("Value must match the pattern") )
                        errorStr =errorStr + "<li>" + err.message + "(" + editor.getEditor(err.path.replace(/\.oneOf\[\d\]/g,"").substring(0,err.path.replace(/\.oneOf\[\d\]/g,"").lastIndexOf("."))).header_text + err.path.replace(/\.oneOf\[\d\]/g,"").substring(err.path.replace(/\.oneOf\[\d\]/g,"").lastIndexOf(".")) + ")</li>";
                    });
                indicator.css("color", "red");
                indicator.val("Errors: <br><ul>" + errorStr + "</ul>");
            }
            // Valid
            else {
                indicator.css("color", "green");
                indicator.val("valid");
            }
        });
    }
            
    $("#loadFile").click(function(){
        if (window.FileReader) {
            var fileInput = $('#load-file');
            fileInput.change(function(e) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    if( (fileInput[0].files[0].name.endsWith(".yaml")) || (fileInput[0].files[0].name.endsWith(".yml"))){
                        editor.setValue(YAML.parse(reader.result));
                    }else{
                        editor.setValue(JSON.parse(reader.result));
                    }
                }
                reader.readAsText(fileInput[0].files[0]);  
            });
            fileInput.trigger('click');
        }else{
            alert('Your browser doesn\'t support reading files from disk.');
        }
    });

    $("#saveFile").click(function(){
        var aFileParts = [JSON.stringify(editor.getValue())];
        var oMyBlob = new Blob(aFileParts, {type : 'application/json'}); // the blob
        window.open(URL.createObjectURL(oMyBlob));
    });
            
    $("#resetFile").click(function(){
        resetTemplate();
    });

    function resetTemplate() {
        $( "#dialog-confirm" ).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
            "Reset": function() {
                editor.setValue("");
                $( this ).dialog( "close" );
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
            }
        });
    }

    function getJsonSchemas(version){
        var template="";
        var listaSchemasStr="";
        var schemas = [];
        var baseURL = window.location.protocol + "//" + window.location.host;
        var listFilesURL = baseURL + "/schemas/v" + version + "/lista.txt";
        
        $.get(listFilesURL, function(data){
            listaSchemasStr = data 
        });

        var schemalist = listaSchemasStr.split(/\r?\n/).filter(Boolean);
        var i=0;        
        schemalist.forEach(function(schemaFile) {
            var schemaURL = baseURL + "/schemas/v" + version + "/" + schemaFile;
            $.getJSON(schemaURL, function(data){
                i++;
                if("x-kubernetes-group-version-kind" in data){	
                    if(data["x-kubernetes-group-version-kind"][0].Kind == 'ProcessedTemplate' || data["x-kubernetes-group-version-kind"][0].kind == 'ProcessedTemplate')
                        template = data;
                    else
                        schemas.push(data);
                }
            });
            if (i == schemalist.length)
                $("#progress").addClass("hide");    
        });

        delete template.properties.objects.items.properties.Raw;

        template.properties.kind.type="string";
        template.properties.kind.default="Template";
        template.properties.apiVersion.type="string";
        template.properties.apiVersion.default="v1";
        template.properties.metadata.properties.name.type="string";
        template.required=["objects","kind", "apiVersion","metadata"];
        template.properties.metadata.required=["name"];

        var oneOfStr=[];
        schemas.forEach(function(schema){
            schema.properties.kind.type="string";
            schema.properties.apiVersion.type="string";
            var schemaKind = schema["x-kubernetes-group-version-kind"][0].Kind || schema["x-kubernetes-group-version-kind"][0].kind;
            schema.properties.kind.default = schemaKind;
            schema.properties.kind.pattern = schemaKind;
            schema.properties.apiVersion.default = schema["x-kubernetes-group-version-kind"][0].Version || schema["x-kubernetes-group-version-kind"][0].version;
            if(!("metadata" in schema.properties)){
                schema.properties.metadata = {};	
                schema.properties.metadata.properties={};	
            }
            if(!("name" in schema.properties.metadata.properties)){
                schema.properties.metadata.properties.name={};
            }
            schema.properties.metadata.properties.name.type="string";
            schema.properties.metadata.required=["name"];
            oneOfStr.push({"title":schema.properties.kind.default, "type": "object", "properties": schema.properties, "description": schema.description, "required": ["kind","apiVersion","metadata"], "options": {"multiple_editor_select_via_property": {"property": "kind", "value": schemaKind }} });
        });
        
        template.properties.objects.type="array";
        template.properties.parameters.type="array";
        template.properties.objects.items = {"oneOf": oneOfStr};
        template.properties.parameters.items.headerTemplate= "{{ i1 }} - {{ self.name }}";
        template.properties.objects.items.headerTemplate= "{{ i1 }} - {{ self.kind}} - {{ self.metadata.name }}";
        
        return template;
    }

});
