// Upload API
var uploadUrl = "http://localhost:8080/upload";

// Convert base64 to a Blob object
function base64ToBlob(base64Data, contentType) {
  contentType = contentType || "";
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

// Listen for shortcut key events and send specified ones to content.js
chrome.commands.onCommand.addListener(function (command) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { command });
  });
});

// Listen for events from content.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Capture a screenshot of the current page and send it to content.js for
  // further processing. (background.js cannot utilize canvas, so cropping
  // needs to be done through content.js by leveraging canvas in the page.)
  if (message.type === "get-capture") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
      console.log(dataUrl);
      sendResponse({
        image: dataUrl,
      });
    });

    return true;
  }

  // Receive base64 data processed by content.js after cropping, and
  // proceed with subsequent upload operations
  if (message.type === "save-capture") {
    // Convert base64 image to Blob
    var blob = base64ToBlob(
      message.dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
      "image/png"
    );
    var formData = new FormData();
    formData.append("image", blob, "capture-image.png");

    // Send POST request
    fetch(uploadUrl, { method: "POST", body: formData })
      .then((response) => response.text())
      .then((response) => {
        if (response) {
          // success
          console.log("Image uploaded successfully");
          sendResponse({ status: "succ", result: response });
        } else {
          // fail
          console.error("Error uploading image:", response);
          sendResponse({
            status: "fail",
            result: response,
          });
        }
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        sendResponse({
          status: "error",
          result: `${error.name}: ${error.message}`,
        });
      });

    return true;
  }
});
