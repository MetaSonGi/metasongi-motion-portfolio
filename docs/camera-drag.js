export function bindCameraDrag(stage, signal, onStart, yawLimit) {
  let gesture;
  let yaw = 0;
  let pitch = 0;
  const options = { signal };

  function end(event) {
    if (event.pointerId !== gesture?.id) return;
    gesture = undefined;
    stage.classList.remove('camera-dragging');
  }

  stage.addEventListener('pointerdown', event => {
    if (gesture || !event.isPrimary || event.button !== 0 ||
        event.target.closest('button,a,input,select,textarea,[contenteditable],dialog')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
  }, options);

  window.addEventListener('pointermove', event => {
    if (event.pointerId !== gesture?.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
        end(event);
        return;
      }
      gesture.dragging = true;
      onStart();
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('camera-dragging');
    }
    yaw = Math.max(-yawLimit, Math.min(yawLimit, yaw - dx * .0045));
    pitch = Math.max(-.34, Math.min(.34, pitch + dy * .0035));
    gesture.x = event.clientX;
    gesture.y = event.clientY;
  }, options);

  window.addEventListener('pointerup', end, options);
  window.addEventListener('pointercancel', end, options);
  stage.addEventListener('lostpointercapture', end, options);
  return {
    get yaw() { return yaw; },
    get pitch() { return pitch; },
    reset() { yaw = 0; pitch = 0; },
  };
}
