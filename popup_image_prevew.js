import { app } from "../../scripts/app.js";

const ext = {
  name: "PopupImagePreview",
  async setup() {
    const css = `
#lightboxModal {
  display: none;
  position: fixed;
  z-index: 1001;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(20, 20, 20, 0.95);
  user-select: none;
  -webkit-user-select: none;
  flex-direction: column;
}
#lightboxModal #PPrevewImage {
  margin: auto;
}

#lightboxModal span.modalControls {
  color: white;
  text-shadow: 0px 0px 0.25em black;
  font-size: 35px;
  font-weight: bold;
  cursor: pointer;
  width: 1em;
}
#lightboxModal span.modalControls.close-btn {
  cursor: pointer;
  position: absolute;
  padding: 10px;
  top: 10px;
  right: 10px;
}
#lightboxModal .modalPrev,
#lightboxModal .modalNext {
  cursor: pointer;
  position: absolute;
  top: 50%;
  width: auto;
  padding: 16px;
  margin-top: -50px;
  color: white;
  font-weight: bold;
  font-size: 20px;
  transition: 0.6s ease;
  border-radius: 0 3px 3px 0;
  user-select: none;
  -webkit-user-select: none;
}
#lightboxModal .modalNext {
  right: 0;
  border-radius: 3px 0 0 3px;
}

`;

    // 设置移动端友好的css
    let style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);
    // html
    let modal = document.createElement("div");
    // modal.innerHTML = html;
    let modalContainer = document.createElement("div");
    modalContainer.id = "lightboxModal";
    let imageDom = document.createElement("img");
    imageDom.id = "PPrevewImage";
    modalContainer.appendChild(imageDom);
    let closeBtn = document.createElement("span");
    closeBtn.className = "modalControls close-btn";
    closeBtn.innerText = "×";
    modalContainer.appendChild(closeBtn);
    let modalPrev = document.createElement("span");
    modalPrev.className = "modalPrev";
    modalPrev.innerText = "❮";
    let modalNext = document.createElement("span");
    modalNext.className = "modalNext";
    modalNext.innerText = "❯";
    modalContainer.appendChild(modalPrev);
    modalContainer.appendChild(modalNext);
    modal.appendChild(modalContainer);

    function closeModal(e) {
      e.stopPropagation();
      modalContainer.style.display = "none";
      modalContainer.removeEventListener("click", closeModal);
    }
    closeBtn.addEventListener("click", closeModal);
    modal = document.body.appendChild(modal);
    let store = {
      images: [],
      index: 0,
    };
    modalPrev.onclick = function (e) {
      e.stopPropagation();
      if (!store.images.length) return;
      store.index--;
      if (store.index < 0) store.index = store.images.length - 1;
      imageDom.src = store.images[store.index].src;
    };
    modalNext.onclick = function (e) {
      e.stopPropagation();
      if (!store.images.length) return;
      store.index++;
      if (store.index >= store.images.length) store.index = 0;
      imageDom.src = store.images[store.index].src;
    };
    function getImageTop(node) {
      let shiftY;
      if (node.imageOffset != null) {
        shiftY = node.imageOffset;
      } else {
        if (node.widgets?.length) {
          const w = node.widgets[node.widgets.length - 1];
          shiftY = w.last_y;
          if (w.computeSize) {
            shiftY += w.computeSize()[1] + 4;
          } else if (w.computedHeight) {
            shiftY += w.computedHeight;
          } else {
            shiftY += LiteGraph.NODE_WIDGET_HEIGHT + 4;
          }
        } else {
          shiftY = node.computeSize()[1];
        }
      }
      return shiftY;
    }
    LiteGraph.pointerListenerAdd(
      app.canvas.canvas,
      "down",
      function (e) {
        e.stopPropagation();
        var node = app.graph.getNodeOnPos(
          e.canvasX,
          e.canvasY,
          app.graph.visible_nodes,
          5
        );
        if (
          node &&
          node.imageIndex >= 0 &&
          node.imgs &&
          node.imgs[node.imageIndex]
        ) {
          let top = getImageTop(node);
          let wrapPos = [node.pos[0], node.pos[1] + top];
          let imagePos = [];
          if (
            node.pos[1] + top + 40 < e.canvasY &&
            node.pos[1] + node.size[1] - 40 > e.canvasY &&
            node.pos[0] + 40 < e.canvasX &&
            node.pos[0] + node.size[0] - 40 > e.canvasX
          ) {
            store.index = node.imageIndex;
            store.images = node.imgs;
            imageDom.src = node.imgs[node.imageIndex].src;
            modalContainer.style.display = "flex";
            setTimeout(() => {
              modalContainer.addEventListener("click", closeModal);
            }, 500);
          }
        }
      },
      true
    );

    function handelEvent() {
      let imageContainer = document.getElementById("lightboxModal");
      imageContainer.style.width = "100%";
      imageContainer.style.height = "100%";
      imageContainer.style.overflow = "hidden";
      function disableClose(e) {
        e.stopPropagation();
      }
      let img = imageContainer.querySelector("img");
      img.style.width = "auto";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.maxHeight = "100%";
      let scale = 1;
      let lastX = 0;
      let lastY = 0;
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
      let touchStore = {};
      let event = {
        wheel: function (event) {
          event.stopPropagation();
          event.preventDefault();
          img.style.transition = "transform 0.3s ease";
          let delta = Math.max(
            -1,
            Math.min(1, event.wheelDelta || -event.detail)
          );
          let zoomStep = 0.1;
          let zoom = 1 + delta * zoomStep;
          scale *= zoom;
          //   图片中心坐标
          let centerX = imageContainer.offsetWidth / 2;
          let centerY = imageContainer.offsetHeight / 2;
          //   当前中心坐标
          let deltaCenterX = centerX + offsetX;
          let deltaCenterY = centerY + offsetY;
          //   鼠标位置与中心坐标的差
          let mouseDistanceX = event.clientX - deltaCenterX;
          let mouseDistanceY = event.clientY - deltaCenterY;
          //  以当前位置缩放会产生的距离变化
          let dX = mouseDistanceX - mouseDistanceX * zoom;
          let dY = mouseDistanceY - mouseDistanceY * zoom;
          // 计算缩放后的图片中心偏移
          offsetX = Math.min(centerX, Math.max(-centerX, offsetX + dX));
          offsetY = Math.min(centerY, Math.max(-centerY, offsetY + dY));

          img.style.transform =
            "translate(" +
            offsetX +
            "px, " +
            offsetY +
            "px) scale(" +
            scale +
            ")";
        },
        mousedown: function (event) {
          event.stopPropagation();
          isDragging = true;
          lastX = event.clientX - offsetX;
          lastY = event.clientY - offsetY;
          img.style.cursor = "grabbing";
        },
        mousemove: function (event) {
          img.style.transition = "";
          event.stopPropagation();
          event.preventDefault();
          if (isDragging) {
            img.onclick = disableClose;
            modalContainer.removeEventListener("click", closeModal);
            let deltaX = event.clientX - lastX;
            let deltaY = event.clientY - lastY;
            offsetX = deltaX;
            offsetY = deltaY;
            img.style.transform =
              "translate(" +
              deltaX +
              "px, " +
              deltaY +
              "px) scale(" +
              scale +
              ")";
          }
        },
        mouseup: function (event) {
          event.stopPropagation();
          isDragging = false;
          img.style.cursor = "grab";
        },
        mouseleave: function (event) {
          event.stopPropagation();
          isDragging = false;
          img.style.cursor = "grab";
        },
        reset() {
          scale = 1;
          lastX = 0;
          lastY = 0;
          touchStore.last2X = 0;
          touchStore.last2Y = 0;
          offsetX = 0;
          offsetY = 0;
          touchStore = {};
          img.style.transform = "none";
          img.onclick = undefined;
        },
        touchcancel: function (event) {
          event.stopPropagation();
          event.preventDefault();
          img.onclick = undefined;
          img.style.transition = "";
          // 获取手势缩放比例
          let newScale = scale * event.scale;
          // 设置img标签的样式，实现缩放效果
          img.style.transform =
            "translate(" +
            offsetX +
            "px, " +
            offsetY +
            "px) scale(" +
            scale +
            ")";
        },
        touchend: function (event) {
          // 更新缩放比例
          event.stopPropagation();
          img.onclick = undefined;
          if (!event.targetTouches.length) {
            touchStore.tpuchScale = false;
          }
        },
        touchstart: function (event) {
          event.stopPropagation();
          if (!touchStore.tpuchScale) {
            lastX = event.targetTouches[0].pageX - offsetX;
            lastY = event.targetTouches[0].pageY - offsetY;
          }
          touchStore.tpuchScale = false;
          if (event.targetTouches[1]) {
            touchStore.tpuchScale = true;
            touchStore.last1X = event.targetTouches[0].pageX;
            touchStore.last1Y = event.targetTouches[0].pageY;
            touchStore.last2X = event.targetTouches[1].pageX;
            touchStore.last2Y = event.targetTouches[1].pageY;
            touchStore.scale = scale;
          }
        },
        touchmove: function (event) {
          event.stopPropagation();
          event.preventDefault();
          img.onclick = disableClose;
          modalContainer.removeEventListener("click", closeModal);
          if (event.targetTouches[1]) {
            img.style.transition = "transform 0.3s ease";
            touchStore.delta1X = event.targetTouches[0].pageX;
            touchStore.delta1Y = event.targetTouches[0].pageY;
            touchStore.delta2X = event.targetTouches[1].pageX;
            touchStore.delta2Y = event.targetTouches[1].pageY;
            let lastLen = Math.sqrt(
              Math.pow(touchStore.last2X - touchStore.last1X, 2) +
                Math.pow(touchStore.last2Y - touchStore.last1Y, 2)
            );
            let deltaLen = Math.sqrt(
              Math.pow(touchStore.delta2X - touchStore.delta1X, 2) +
                Math.pow(touchStore.delta2Y - touchStore.delta1Y, 2)
            );
            let zoom = deltaLen / lastLen;
            scale = touchStore.scale * zoom;
            //   图片中心坐标
            let centerX = imageContainer.offsetWidth / 2;
            let centerY = imageContainer.offsetHeight / 2;
            //   当前中心坐标
            let deltaCenterX = centerX + offsetX;
            let deltaCenterY = centerY + offsetY;
            //   缩放中心位置与中心坐标的差
            let mouseDistanceX =
              touchStore.delta1X +
              (touchStore.delta2X - touchStore.delta1X) / 2 -
              deltaCenterX;
            let mouseDistanceY =
              touchStore.delta1Y +
              (touchStore.delta2Y - touchStore.delta1Y) / 2 -
              deltaCenterY;
            //  以当前位置缩放会产生的距离变化
            let dX = mouseDistanceX - mouseDistanceX * zoom;
            let dY = mouseDistanceY - mouseDistanceY * zoom;
            // 计算缩放后的图片中心偏移
            offsetX = Math.min(centerX, Math.max(-centerX, offsetX + dX));
            offsetY = Math.min(centerY, Math.max(-centerY, offsetY + dY));
            img.style.transform =
              "translate(" +
              offsetX +
              "px, " +
              offsetY +
              "px) scale(" +
              scale +
              ")";
          } else if (!touchStore.tpuchScale) {
            img.style.transition = "";
            offsetX = event.targetTouches[0].pageX - lastX;
            offsetY = event.targetTouches[0].pageY - lastY;
            img.style.transform =
              "translate(" +
              offsetX +
              "px, " +
              offsetY +
              "px) scale(" +
              scale +
              ")";
          }
        },
      };

      function reloadZoomEvent(new_event) {
        if (!new_event) return;
        imageContainer.removeEventListener("click", event.reset);
        imageContainer.removeEventListener("wheel", event.wheel);
        img.removeEventListener("mousedown", event.mousedown);
        img.removeEventListener("mousemove", event.mousemove);
        img.removeEventListener("mouseup", event.mouseup);
        img.removeEventListener("mouseleave", event.mouseleave);
        // 移动端
        imageContainer.removeEventListener("touchend", event.touchend);
        imageContainer.removeEventListener("touchstart", event.touchstart);
        imageContainer.removeEventListener("touchmove", event.touchmove);
        event = new_event;

        imageContainer.addEventListener("click", event.reset);
        imageContainer.addEventListener("wheel", event.wheel);
        img.addEventListener("mousedown", event.mousedown);
        img.addEventListener("mousemove", event.mousemove);
        img.addEventListener("mouseup", event.mouseup);
        img.addEventListener("mouseleave", event.mouseleave);
        // 移动端
        imageContainer.addEventListener("touchend", event.touchend);
        imageContainer.addEventListener("touchstart", event.touchstart);
        imageContainer.addEventListener("touchmove", event.touchmove);
      }
      reloadZoomEvent(event);
    }
    handelEvent();
  },
};

app.registerExtension(ext);
