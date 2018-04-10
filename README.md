# **Openshift Template Visual Editor**

This is a simple web editor to create or modify [Red Hat Openshift](http://www.openshift.com) [templates](https://access.redhat.com/documentation/en-us/openshift_container_platform/3.7/html/developer_guide/dev-guide-templates) in a visual way, much simpler than struggling with json or yaml directly.

You can import json or yaml templates, modify them and export them as json. The tool also validates the template and indicates found errors. It currently works with Openshift v3.6 and v3.7 schemas.

## Instructions
1. Clone this repo 
2. Start a webserver to serve static content
```
python -m SimpleHTTPServer 8080
```

or just
```
./run.sh
```

4. Open your browser in http://localhost:8080
5. Import an existing template in JSON or YAML (optional).
6. Start working on the template.


|**Template Validation** ![Template Validation](images/Selection_021.png)|
|---|
|**Editing Services** ![Edit Service](images/Selection_022.png)|
|**Editing ConfigMaps**![Edit ConfigMap](images/Selection_023.png)
|**Writing JSON directly <br>** ![Edit json directly](images/Selection_024.png)|
|**Template Validation** ![Validation](images/Selection_025.png)|
