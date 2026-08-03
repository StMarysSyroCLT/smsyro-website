(function () {
  const data = window.churchAdminAnnouncementData;
  const form = document.querySelector("[data-announcement-form]");
  const textarea = document.querySelector("[data-announcement-text]");
  const status = document.querySelector("[data-save-status]");

  if (!data || !form || !textarea) {
    return;
  }

  textarea.value = data.getSavedText();

  function saveForPreview() {
    data.saveText(textarea.value);

    if (status) {
      status.textContent = "";
    }
  }

  form.addEventListener("submit", () => {
    saveForPreview();
  });
})();
