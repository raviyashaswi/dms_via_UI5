sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
], (Controller, Fragment) => {
    "use strict";

    return Controller.extend("com.cy.dms.dmsthroughui5.controller.View1", {
        onInit() {

        },
        _openDialog: function () {
            var oView = this.getView();
            if (!this._pDialog) {
                this._pDialog = this.loadFragment({
                    name: "com.cy.dms.dmsthroughui5.view.display"
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onCloseDialog: function (oEvent) {
            // This finds the parent object (the Dialog) of the button that was pressed
            oEvent.getSource().getParent().close();
        },

        folder(oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("content");
            var oObject = oContext.getObject();
            if (oObject.object.properties["cmis:baseTypeId"].value == "cmis:folder") {
                
                var foldername = oObject.object.properties["cmis:name"].value
                var sRepo = this.getView().getModel("content").getProperty("/selected/repo")
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                const appModPath = jQuery.sap.getModulePath(appPath);
                var sDestinationPath = appModPath + `/browser/${sRepo}/root/${foldername}`;
                console.log(appId, appPath, appModPath)
                $.ajax({
                    url: sDestinationPath,
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    success: function (oData) {
                        var aRepositories = Object.values(oData.objects);
                        var cModel = this.getView().getModel("content")
                        var h = cModel.getProperty("/folderItems")
                        cModel.setProperty("/folderItems", aRepositories)
                        cModel.setProperty("/selected/obj", oObject.object.properties["cmis:name"].value)

                        console.log(cModel.getData())
                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageToast.show("DMS error:", oError)
                        console.error("DMS error:", oError);
                    }
                });
            }
            else {
                var docID = oObject.object.properties["cmis:objectId"].value

                var sRepo = this.getView().getModel("content").getProperty("/selected/repo")
                var sfolder = this.getView().getModel("content").getProperty("/selected/folderItems")
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                const appModPath = jQuery.sap.getModulePath(appPath);
                var sDestinationPath = appModPath + `/browser/${sRepo}/root/${sfolder}?objectId=${docID}&cmisselector=content`;
                console.log(appId, appPath, appModPath)
                $.ajax({
                    url: sDestinationPath,
                    method: "GET",
                    xhrFields: {
                        responseType: 'blob'
                    },

                    success: function (oBlob) {
                        var cModel = this.getView().getModel("content")

                        var sUrl = URL.createObjectURL(oBlob);
                        cModel.setProperty("/image", sUrl);

                        this._openDialog()

                        // var oHtml = this.getView().byId("pdfHtmlControl");
                        // if (oHtml) {
                        //     // We update the 'data' attribute of the object tag
                        //     var sContent = '<object data="' + sUrl + '" type="application/pdf" width="100%" height="100%"></object>';
                        //     oHtml.setContent(sContent);
                        // }



                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageToast.show("DMS error:", oError)
                        console.error("DMS error:", oError);
                    }
                });
            }
        },
        delete(oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("content");
            if (!oContext) {
                console.error("Binding context not found. Check your model name.");
                return;
            }

            var oObject = oContext.getObject();
            var sObjectId = oObject.object.properties["cmis:objectId"].value;
            console.log(sObjectId);

            var foldername = oObject.object.properties["cmis:name"].value
            var sRepo = this.getView().getModel("content").getProperty("/selected/repo")
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModPath = jQuery.sap.getModulePath(appPath);
            var sDestinationPath = appModPath + `/browser/${sRepo}/root/${foldername}`;



            var oFormData = new FormData();
            oFormData.append("cmisaction", "delete");
            oFormData.append("objectId", sObjectId);
            oFormData.append("allVersions", true);

            $.ajax({
                url: sDestinationPath,
                method: "POST",
                data: oFormData,
                processData: false,
                contentType: false,
                headers: {
                    "Accept": "application/json"
                },
                success: function (oData) {
                    sap.m.MessageToast.show("Deleted", oData)
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show("DMS error:", oError)
                    console.error("DMS error:", oError);
                }
            });
        },
        objects() {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModPath = jQuery.sap.getModulePath(appPath);
            var sRepo = this.getView().getModel("content").getProperty("/selected/repo")

            var sDestinationPath = appModPath + `/browser/${sRepo}/root`;
            console.log("appModPath====", appModPath)

            $.ajax({
                url: sDestinationPath,
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (oData) {
                    var cModel = this.getView().getModel("content")
                    var aRepositories = Object.values(oData.objects);
                    cModel.setProperty("/objects", aRepositories)
                    console.log(cModel.getData())
                }.bind(this),


                error: function (oError) {
                    sap.m.MessageToast.show("DMS error:", oError)
                    console.error("DMS error:", oError);
                }
            });
        },

        handleUploadComplete: function (oEvent) {
            var sResponse = "File upload complete. Status: 200",
                iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0]),
                sMessage;

            if (sResponse) {
                sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
                sap.m.MessageToast.show(sMessage);
            }
        },

        handleUploadPress: function () {
            var oFileUploader = this.byId("_IDGenFileUploader");
            var oDomRef = oFileUploader.getFocusDomRef();
            var oFile = oDomRef.files[0]; // Get the actual File object from the DOM

            if (!oFile) {
                sap.m.MessageToast.show("Please select a file first.");
                return;
            }

            oFileUploader.checkFileReadable().then(function () {
                // 1. Prepare FormData for CMIS POST
                var oFormData = new FormData();
                oFormData.append("cmisaction", "createDocument");
                oFormData.append("propertyId[0]", "cmis:name");
                oFormData.append("propertyValue[0]", oFile.name);
                oFormData.append("propertyId[1]", "cmis:objectTypeId");
                oFormData.append("propertyValue[1]", "cmis:document");

                oFormData.append("content", oFile);

                this._executeManualUpload(oFormData, oFileUploader);

            }.bind(this), function (error) {
                sap.m.MessageToast.show("The file cannot be read.");
            });
        },

        _executeManualUpload: function (oFormData, oFileUploader) {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModPath = jQuery.sap.getModulePath(appPath);
            var foldername = this.getView().getModel("content").getProperty("/selected/obj")
            var sRepo = this.getView().getModel("content").getProperty("/selected/repo")

            var sUrl = appModPath + `/browser/${sRepo}/root/${foldername}`;

            sap.ui.core.BusyIndicator.show(0);

            $.ajax({
                url: sUrl,
                type: "POST",
                timeout: 5000,
                data: oFormData,
                processData: false, // Critical for FormData
                contentType: false, // Critical for FormData
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("File uploaded successfully!");
                    oFileUploader.clear();
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("Upload error:", oError);
                    sap.m.MessageToast.show("Upload failed. Check console.");
                }
            });
        },

        _post(repoId, folderName, fileName, fileContent) {
            const uploadPath = `/browser/${repoId}/root/${folderName}`;

            const form = new FormData();
            form.append('cmisaction', 'createDocument');
            form.append('propertyId[0]', 'cmis:objectTypeId');
            form.append('propertyValue[0]', 'cmis:document');
            form.append('propertyId[1]', 'cmis:name');
            form.append('propertyValue[1]', fileName);
            form.append('succinct', 'true');
            form.append('filename', fileName);
            form.append('includeAllowableActions', 'true');

            const buffer = Buffer.from(fileContent, 'base64');


            form.append('content', buffer, {
                filename: fileName,
                contentType: req.data.mediaType || 'application/octet-stream'
            });


            $.ajax({
                method: 'POST',
                path: uploadPath,
                data: form.getBuffer(), // Send the full buffer instead of the stream object
                headers: {
                    ...form.getHeaders(),
                    'Accept': 'application/json'
                },
                success: function (oData) {
                    sap.m.MessageToast.show("Deleted", oData)
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show("DMS error:", oError)
                    console.error("DMS error:", oError);
                }
            })
        }

    });
});