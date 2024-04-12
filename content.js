console.log("capture screen content js loaded...");

(() => {
  // Create a DIV node, mainly used to establish the DOM for the selection area
  function createDiv({ id, className }) {
    var view = document.createElement("div");
    if (id) view.id = id;
    if (className) view.className = className;
    return view;
  }

  // Handle mouse dragging for resizable selection
  function startDrag(event) {
    event.preventDefault();
    const currentHandle = event.target;
    const isResizeHandle = currentHandle.className.includes("resize-handle");
    if (isResizeHandle) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = dragElement.offsetLeft;
    const startTop = dragElement.offsetTop;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
    function drag(event) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;

      const { x, y } = constrainTargetPosition(
        { x: newLeft, y: newTop },
        dragElement
      );

      dragElement.style.left = x + "px";
      dragElement.style.top = y + "px";
    }
    function stopDrag() {
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }
  }

  // Handle mouse scaling of resizable selection
  function startResize(event) {
    event.preventDefault();
    const currentHandle = event.target;
    const direction = currentHandle.className.split(" ")[1];
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = dragElement.offsetWidth;
    const startHeight = dragElement.offsetHeight;
    const startLeft = dragElement.offsetLeft;
    const startTop = dragElement.offsetTop;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
    function resize(event) {
      const { clientX, clientY } = constrainMouseEventPosition(event);
      const dx = clientX - startX;
      const dy = clientY - startY;
      let width = startWidth,
        height = startHeight,
        left = startLeft,
        top = startTop;
      if (direction.includes("left")) {
        width = startWidth - dx + "px";
        left = startLeft + dx + "px";
      }
      if (direction.includes("right")) {
        width = startWidth + dx + "px";
        left = startLeft + "px";
      }
      if (direction.includes("top")) {
        height = startHeight - dy + "px";
        top = startTop + dy + "px";
      }
      if (direction.includes("bottom")) {
        height = startHeight + dy + "px";
        top = startTop + "px";
      }
      if (parseInt(width) <= 0 || parseInt(height) <= 0) return;
      dragElement.style.width = width;
      dragElement.style.height = height;
      dragElement.style.left = left;
      dragElement.style.top = top;

      console.log({ left, top, width, height });
    }
    function stopResize() {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    }
  }

  // Ensure that when scaling the resizable area, the mouse coordinates
  // remain within the visible viewport.
  function constrainMouseEventPosition(ev) {
    const { clientX, clientY } = ev;
    const { innerWidth, innerHeight } = window;

    const constrainedX = Math.max(0, Math.min(clientX, innerWidth));
    const constrainedY = Math.max(0, Math.min(clientY, innerHeight));

    return { clientX: constrainedX, clientY: constrainedY };
  }

  // Ensure that when dragging the resizable area, the target area does
  // not exceed the visible range.
  function constrainTargetPosition(newPos, targetNode) {
    const { innerWidth, innerHeight } = window;

    const targetRect = targetNode.getBoundingClientRect();

    const maxYDistance = innerHeight - targetRect.height;
    const maxXDistance = innerWidth - targetRect.width;

    const constrainedX = Math.max(0, Math.min(newPos.x, maxXDistance));
    const constrainedY = Math.max(0, Math.min(newPos.y, maxYDistance));

    return { x: constrainedX, y: constrainedY };
  }

  // Determine whether the current operation involves cropping and capturing screenshots
  function isCaptureShow() {
    return maskDiv.style.display !== "none";
  }

  // Enable resizing of the cropping selection
  function showCapture() {
    if (!isCaptureShow()) {
      maskDiv.style.display = "initial";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
  }

  // Disable resizing of the cropping selection
  function hideCapture() {
    if (isCaptureShow()) {
      maskDiv.style.display = "none";
      document.documentElement.style.overflow = "initial";
      document.body.style.overflow = "initial";
    }
  }

  // Crop the screenshot according to the given coordinates, width, and height
  function cropImage(imageSrc, x, y, width, height, callback) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var img = new Image();

    img.onload = function () {
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      var croppedImage = canvas.toDataURL("image/png");

      callback(croppedImage);
    };

    // 加载原始图像
    img.src = imageSrc;
  }

  // This is a method for debugging purposes, used to display
  // the cropped image during debugging.
  function insertPreviewImage(base64) {
    var previewImage = document.createElement("img");
    previewImage.src = base64;
    previewImage.className = "aaz-preview-image";
    document.body.appendChild(previewImage);
  }

  // Following are the specific operational steps

  // 1. Create a mask layer
  var maskDiv = createDiv({ id: "J_Mask", className: "aaz-mask " });
  maskDiv.style.display = "none";
  document.body.appendChild(maskDiv);

  // 2. Create the cropping functionality area.
  var boxDiv = createDiv({ id: "J_Drag", className: "box" });
  maskDiv.appendChild(boxDiv);

  // 3. Add resize handles to the cropping area
  var handlers = [
    { className: "resize-handle top-left" },
    { className: "resize-handle top" },
    { className: "resize-handle top-right" },
    { className: "resize-handle right" },
    { className: "resize-handle bottom-right" },
    { className: "resize-handle bottom" },
    { className: "resize-handle bottom-left" },
    { className: "resize-handle left" },
  ];

  handlers.forEach(({ className }) => {
    var handlerDiv = createDiv({ className });
    boxDiv.appendChild(handlerDiv);
  });

  // 4. Listen for and handle events for dragging the cropping area
  const dragElement = document.getElementById("J_Drag");
  dragElement.addEventListener("mousedown", startDrag);

  // 5. Listen for events triggered by resizing handles to scale the cropping area.
  const resizeHandles = document.getElementsByClassName("resize-handle");
  Array.from(resizeHandles).forEach((handle) => {
    handle.addEventListener("mousedown", startResize);
  });

  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener(function (message) {
    console.log(message);

    // Received command: Start screen cropping
    if (message.command === "capture-start") showCapture();

    // Received command: Cancel screen cropping
    if (message.command === "capture-cancel") hideCapture();

    // Received command: Confirm screen cropping execution
    if (message.command === "capture-confirm") {
      if (!isCaptureShow()) return;

      var currentRect = boxDiv.getBoundingClientRect();
      console.log(currentRect);

      hideCapture();

      // Ensure the screenshot is taken only after the cropping area
      // is completely hidden using setTimeout delay
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: "get-capture" }, ({ image }) => {
          console.log(image);

          const { x, y, width, height } = currentRect;
          cropImage(image, x, y, width, height, (croppedImage) => {
            // insertPreviewImage(croppedImage);
            chrome.runtime.sendMessage(
              { type: "save-capture", dataUrl: croppedImage },
              (msg) => {
                // console.log(msg);

                if (msg.status === "succ") {
                  ClipboardJS.copy(msg.result);
                  alert("response has copied to the clipboard");
                } else {
                  alert(`[${msg.status}] ${msg.result}`);
                }
              }
            );
          });
        });
      }, 300);
    }
  });
})();
