(function boot() {
  const canvas = document.getElementById("game");
  const preview = document.getElementById("preview");
  Engine.init(canvas, {
    onStart() {},
    onMenu: () => UI.onMenu(),
    onOver: (snap) => UI.onOver(snap),
    onHud: (snap, world) => UI.onHud(snap, world),
  });
  UI.init();

  let t = 0;
  function previewLoop() {
    t += 0.016;
    if (Engine.getState() === "menu") {
      Engine.drawPreview(preview, UI.pick.character, UI.pick.gear, t);
    }
    requestAnimationFrame(previewLoop);
  }
  previewLoop();
})();
